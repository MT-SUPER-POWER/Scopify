import type { PrismaLineLayout, PrismaTiles } from "@/types/lyrics/prisma/model";
import { at } from "./at";

// lib/lyrics/prisma/raster.ts
// Draws a line on a CPU canvas. Red holds the crisp glyphs and green a soft blurred copy for the glow; the
// runtime uploads the two channels and cuts the shards from red. Staying on the CPU keeps the read-back cheap
// and avoids a GPU stall, and the work happens one step per frame, ahead of the line.

/** A piece is kept when at least this share of it is ink. */
const MIN_COVER = 0.2;
const GLOW_SCALE = 0.25;

export interface PrismaPlateImage {
  /** Device pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Tightly packed RG bytes. */
  pixels: Uint8Array;
  /** The red channel only, one byte per pixel, for cutting shards. */
  ink: Uint8Array;
}

export class PrismaRaster {
  private readonly canvas = document.createElement("canvas");
  private readonly context: CanvasRenderingContext2D;
  private readonly glowCanvas = document.createElement("canvas");
  private readonly glowContext: CanvasRenderingContext2D;
  private readonly measureContext: CanvasRenderingContext2D;
  private readonly advances = new Map<string, Map<string, number>>();

  constructor() {
    const context = this.canvas.getContext("2d", { alpha: false, willReadFrequently: true });
    const glowContext = this.glowCanvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });
    const measureContext = document.createElement("canvas").getContext("2d");
    if (!context || !glowContext || !measureContext) throw new Error("[Prisma] no 2D canvas");
    this.context = context;
    this.glowContext = glowContext;
    this.measureContext = measureContext;
  }

  readonly measure = (font: string, char: string) => {
    let byChar = this.advances.get(font);
    if (!byChar) {
      byChar = new Map();
      this.advances.set(font, byChar);
    }
    let advance = byChar.get(char);
    if (advance === undefined) {
      this.measureContext.font = font;
      advance = this.measureContext.measureText(char).width;
      byChar.set(char, advance);
    }
    return advance;
  };

  clearMeasurements() {
    this.advances.clear();
  }

  /** The text's rectangle in device pixels, with room for the glow. */
  private deviceBounds(layout: PrismaLineLayout, dpr: number, maxWidth: number, maxHeight: number) {
    const pad = layout.fontPx * 0.5;
    const left = Math.max(0, Math.floor((layout.bounds.x - pad) * dpr));
    const top = Math.max(0, Math.floor((layout.bounds.y - pad) * dpr));
    const right = Math.min(
      maxWidth,
      Math.ceil((layout.bounds.x + layout.bounds.width + pad) * dpr),
    );
    const bottom = Math.min(
      maxHeight,
      Math.ceil((layout.bounds.y + layout.bounds.height + pad) * dpr),
    );
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
  }

  /** Draws the text. Call `read` on a later frame to spread the work. */
  draw(layout: PrismaLineLayout, dpr: number, deviceWidth: number, deviceHeight: number) {
    const box = this.deviceBounds(layout, dpr, deviceWidth, deviceHeight);
    const { canvas, context, glowCanvas, glowContext } = this;
    if (canvas.width < box.width || canvas.height < box.height) {
      canvas.width = Math.max(canvas.width, box.width);
      canvas.height = Math.max(canvas.height, box.height);
    }
    const glowWidth = Math.ceil(box.width * GLOW_SCALE);
    const glowHeight = Math.ceil(box.height * GLOW_SCALE);
    if (glowCanvas.width < glowWidth || glowCanvas.height < glowHeight) {
      glowCanvas.width = Math.max(glowCanvas.width, glowWidth);
      glowCanvas.height = Math.max(glowCanvas.height, glowHeight);
    }

    const place = (target: CanvasRenderingContext2D, scale: number) => {
      target.setTransform(scale, 0, 0, scale, -box.x * (scale / dpr), -box.y * (scale / dpr));
      target.font = layout.font;
      target.textBaseline = "middle";
      target.textAlign = "left";
      for (const glyph of layout.glyphs) {
        target.fillText(glyph.char, glyph.x, glyph.y + glyph.height / 2);
      }
    };

    glowContext.setTransform(1, 0, 0, 1, 0, 0);
    glowContext.filter = "none";
    glowContext.fillStyle = "#000";
    glowContext.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
    glowContext.filter = `blur(${Math.max(1, layout.fontPx * dpr * GLOW_SCALE * 0.12)}px)`;
    glowContext.fillStyle = "#0f0";
    place(glowContext, dpr * GLOW_SCALE);

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#000";
    context.fillRect(0, 0, box.width, box.height);
    context.globalCompositeOperation = "lighter";
    context.imageSmoothingEnabled = true;
    context.drawImage(glowCanvas, 0, 0, glowWidth, glowHeight, 0, 0, box.width, box.height);
    context.fillStyle = "#f00";
    place(context, dpr);
    return box;
  }

  read(box: { x: number; y: number; width: number; height: number }): PrismaPlateImage {
    const { data } = this.context.getImageData(0, 0, box.width, box.height);
    const count = box.width * box.height;
    const pixels = new Uint8Array(count * 2);
    const ink = new Uint8Array(count);
    for (let source = 0, target = 0; target < count; source += 4, target += 1) {
      const red = at(data, source);
      pixels[target * 2] = red;
      pixels[target * 2 + 1] = at(data, source + 1);
      ink[target] = red;
    }
    return { ...box, pixels, ink };
  }
}

/** Cuts a rasterized line into shards. Grows the pieces when the line would exceed `cap`. */
export const cutPrismaTiles = (
  layout: PrismaLineLayout,
  image: PrismaPlateImage,
  dpr: number,
  shardSize: number,
  cap: number,
): PrismaTiles => {
  const collect = (tileWidth: number, tileHeight: number) => {
    const xs: number[] = [];
    const ys: number[] = [];
    const owners: number[] = [];
    const sampleStepX = Math.max(1, Math.floor((tileWidth * dpr) / 4));
    const sampleStepY = Math.max(1, Math.floor((tileHeight * dpr) / 3));
    layout.glyphs.forEach((glyph, glyphListIndex) => {
      const firstRow = Math.floor(glyph.y / tileHeight);
      const lastRow = Math.ceil((glyph.y + glyph.height) / tileHeight);
      for (let row = firstRow; row < lastRow; row += 1) {
        const centerY = (row + 0.5) * tileHeight;
        if (centerY < glyph.y || centerY >= glyph.y + glyph.height) continue;
        // Bricks: every other row is shifted by half a piece.
        const shift = row % 2 ? tileWidth / 2 : 0;
        const firstColumn = Math.floor((glyph.x - shift) / tileWidth);
        const lastColumn = Math.ceil((glyph.x + glyph.width - shift) / tileWidth);
        for (let column = firstColumn; column < lastColumn; column += 1) {
          const centerX = (column + 0.5) * tileWidth + shift;
          if (centerX < glyph.x || centerX >= glyph.x + glyph.width) continue;
          const left = Math.max(0, Math.round((centerX - tileWidth / 2) * dpr) - image.x);
          const right = Math.min(
            image.width,
            Math.round((centerX + tileWidth / 2) * dpr) - image.x,
          );
          const top = Math.max(0, Math.round((centerY - tileHeight / 2) * dpr) - image.y);
          const bottom = Math.min(
            image.height,
            Math.round((centerY + tileHeight / 2) * dpr) - image.y,
          );
          let sum = 0;
          let samples = 0;
          for (let y = top; y < bottom; y += sampleStepY) {
            for (let x = left; x < right; x += sampleStepX) {
              sum += at(image.ink, y * image.width + x);
              samples += 1;
            }
          }
          if (samples && sum / samples / 255 >= MIN_COVER) {
            xs.push(centerX);
            ys.push(centerY);
            owners.push(glyphListIndex);
          }
        }
      }
    });
    return { xs, ys, owners };
  };

  let tileWidth = shardSize;
  let tileHeight = Math.max(2, shardSize * 0.42);
  let pieces = collect(tileWidth, tileHeight);
  if (pieces.xs.length > cap) {
    const grow = Math.sqrt(pieces.xs.length / cap);
    tileWidth *= grow;
    tileHeight *= grow;
    pieces = collect(tileWidth, tileHeight);
  }
  return {
    count: pieces.xs.length,
    x: Float32Array.from(pieces.xs),
    y: Float32Array.from(pieces.ys),
    glyph: Uint16Array.from(pieces.owners),
    tileWidth,
    tileHeight,
  };
};
