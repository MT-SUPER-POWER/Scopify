import type { PrismaBatchData, PrismaBatchEnd, PrismaGlyph } from "@/types/lyrics/prisma/model";
import { at } from "./at";

// lib/lyrics/prisma/batch.ts
// Pairs the pieces of one line with the pieces of the next. Pieces stay in singing order, so an early glyph
// flies to an early glyph, and shuffle inside each glyph so the streams cross. An end that is null is empty
// space: shards rise out of it before the first line and dissolve into it after the last.

/** Bytes per shard: route (4 floats), random (4), times (4), from colour (4 bytes), to colour (4). */
export const PRISMA_BATCH_STRIDE = 56;

const RELEASE_SPREAD = 0.22;
const LAND_SPREAD = 0.1;
const MIN_FLIGHT = 0.3;
const VOID_ENTRANCE = 1.5;
const VOID_EXIT = 1.8;

const seededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

/** Piece indices in singing order, shuffled within each glyph. */
const singingOrder = (end: PrismaBatchEnd, random: () => number) => {
  const { tiles } = end;
  const keys = new Float64Array(tiles.count);
  const order = new Uint32Array(tiles.count);
  for (let index = 0; index < tiles.count; index += 1) {
    keys[index] = at(tiles.glyph, index) + random() * 0.999;
    order[index] = index;
  }
  return order.sort((a, b) => at(keys, a) - at(keys, b));
};

const glyphOf = (end: PrismaBatchEnd, piece: number): PrismaGlyph =>
  at(end.line.glyphs, at(end.layout.glyphs, at(end.tiles.glyph, piece)).glyphIndex);

const colorOfPiece = (end: PrismaBatchEnd, piece: number) =>
  at(end.layout.glyphs, at(end.tiles.glyph, piece)).color;

export const buildPrismaBatch = (
  from: PrismaBatchEnd | null,
  to: PrismaBatchEnd | null,
  view: { width: number; height: number },
  seed: number,
): PrismaBatchData => {
  const anyEnd = from ?? to;
  if (!anyEnd) throw new Error("[Prisma] a flight needs at least one line");
  const random = seededRandom(seed);
  const gaussian = () => (random() + random() + random()) / 1.5 - 1;
  const fromCount = from?.tiles.count ?? 0;
  const toCount = to?.tiles.count ?? 0;
  const count = Math.max(fromCount, toCount);
  const buffer = new ArrayBuffer(count * PRISMA_BATCH_STRIDE);
  const floats = new Float32Array(buffer);
  const bytes = new Uint8Array(buffer);
  const fromOrder = from ? singingOrder(from, random) : null;
  const toOrder = to ? singingOrder(to, random) : null;
  const centerX = view.width / 2;
  const centerY = view.height * 0.45;
  let windowFrom = Infinity;
  let windowTo = -Infinity;

  for (let index = 0; index < count; index += 1) {
    const fromPiece =
      from && fromOrder ? at(fromOrder, Math.floor((index * fromCount) / count)) : -1;
    const toPiece = to && toOrder ? at(toOrder, Math.floor((index * toCount) / count)) : -1;
    const fromGlyph = from ? glyphOf(from, fromPiece) : null;
    const toGlyph = to ? glyphOf(to, toPiece) : null;

    const fromX = from ? at(from.tiles.x, fromPiece) : centerX + gaussian() * view.width * 0.55;
    const fromY = from ? at(from.tiles.y, fromPiece) : centerY + gaussian() * view.height * 0.5;
    const toX = to ? at(to.tiles.x, toPiece) : centerX + gaussian() * view.width * 0.6;
    const toY = to ? at(to.tiles.y, toPiece) : centerY + gaussian() * view.height * 0.55;

    let land: number;
    let release: number;
    let visibleFrom: number;
    let visibleTo: number;
    if (toGlyph) {
      visibleTo = toGlyph.land;
      land = toGlyph.land - random() * LAND_SPREAD;
    } else {
      release = (fromGlyph?.release ?? 0) + random() * RELEASE_SPREAD;
      land = release + VOID_EXIT;
      visibleTo = land;
    }
    if (fromGlyph) {
      visibleFrom = fromGlyph.release;
      release = fromGlyph.release + random() * RELEASE_SPREAD;
      if (land - release < MIN_FLIGHT) release = Math.max(visibleFrom, land - MIN_FLIGHT);
      if (land - release < MIN_FLIGHT) land = release + MIN_FLIGHT;
    } else {
      release = land - VOID_ENTRANCE - random() * 0.5;
      visibleFrom = release;
    }

    windowFrom = Math.min(windowFrom, visibleFrom);
    windowTo = Math.max(windowTo, Math.max(visibleTo, land));

    const floatOffset = (index * PRISMA_BATCH_STRIDE) / 4;
    floats[floatOffset] = fromX;
    floats[floatOffset + 1] = fromY;
    floats[floatOffset + 2] = toX;
    floats[floatOffset + 3] = toY;
    floats[floatOffset + 4] = random();
    floats[floatOffset + 5] = random();
    floats[floatOffset + 6] = random();
    floats[floatOffset + 7] = random();
    floats[floatOffset + 8] = visibleFrom;
    floats[floatOffset + 9] = release;
    floats[floatOffset + 10] = land;
    floats[floatOffset + 11] = Math.max(visibleTo, land);

    const fromColor = colorOfPiece(anyEnd, from ? fromPiece : toPiece);
    const toColor = to ? colorOfPiece(to, toPiece) : fromColor;
    const byteOffset = index * PRISMA_BATCH_STRIDE + 48;
    bytes[byteOffset] = fromColor[0];
    bytes[byteOffset + 1] = fromColor[1];
    bytes[byteOffset + 2] = fromColor[2];
    bytes[byteOffset + 3] = 255;
    bytes[byteOffset + 4] = toColor[0];
    bytes[byteOffset + 5] = toColor[1];
    bytes[byteOffset + 6] = toColor[2];
    bytes[byteOffset + 7] = 255;
  }

  const fallback: [number, number] = [anyEnd.tiles.tileWidth, anyEnd.tiles.tileHeight];
  return {
    buffer,
    count,
    from: windowFrom,
    to: windowTo,
    fromTile: from ? [from.tiles.tileWidth, from.tiles.tileHeight] : fallback,
    toTile: to ? [to.tiles.tileWidth, to.tiles.tileHeight] : fallback,
  };
};
