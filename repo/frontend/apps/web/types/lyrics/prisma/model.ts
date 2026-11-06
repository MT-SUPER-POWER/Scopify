import type { MotionValue } from "framer-motion";
import type { AudioBands, Line } from "@/components/lyrics/folia/src/types";

// types/lyrics/prisma/model.ts
// 聚散 (Prisma): tuning, and the data the runtime passes between its steps.

export interface PrismaTuning {
  /** Length of one shard in CSS px: small reads as dust, large as bricks. */
  shardSize: number;
  /** How hard a line bursts apart. */
  burst: number;
  /** How far the current carries the shards. */
  flow: number;
  /** How visible a line is as a cloud before it is sung; 0 hides it until it lands. */
  swarm: number;
  /** How strongly the music moves everything. */
  audio: number;
  /** Highlights on shards in flight. */
  gloss: number;
  /** Assemble the song title during a long intro, and when a song has no lyrics. */
  showTitle: boolean;
}

export const PRISMA_LIMITS = {
  shardSize: { min: 3, max: 24 },
  burst: { min: 0, max: 2.5 },
  flow: { min: 0, max: 2.5 },
  swarm: { min: 0, max: 1 },
  audio: { min: 0, max: 2 },
  gloss: { min: 0, max: 2 },
} as const satisfies Partial<Record<keyof PrismaTuning, { min: number; max: number }>>;

export type PrismaNumberKey = keyof typeof PRISMA_LIMITS;

export const DEFAULT_PRISMA_TUNING: PrismaTuning = {
  shardSize: 7,
  burst: 1,
  flow: 1,
  swarm: 0.6,
  audio: 1,
  gloss: 1,
  showTitle: true,
};

export interface PrismaSong {
  lines: Line[];
  seed: string | number;
  title?: string | null;
}

export interface PrismaRuntimeInput {
  host: HTMLElement;
  currentTime: MotionValue<number>;
  audioPower: MotionValue<number>;
  audioBands: AudioBands;
  onFirstFrame: () => void;
  onFailed: () => void;
  /** The WebGL context came back: the shell builds a new runtime. */
  onRestored: () => void;
}

/** One grapheme of a line: when it is sung, when its shards land and when they leave. */
export interface PrismaGlyph {
  char: string;
  start: number;
  end: number;
  wordIndex?: number;
  /** Its shards have all landed by now, and the crisp glyph takes over. */
  land: number;
  /** Its shards start leaving at this time. Infinity keeps it on screen. */
  release: number;
}

/** A lyric line, or the song title, with its timing worked out. */
export interface PrismaLine {
  text: string;
  /** Every grapheme of the text in order, spaces included. */
  glyphs: PrismaGlyph[];
  start: number;
  end: number;
  isChorus: boolean;
  source: Line | null;
}

/** A grapheme placed on screen, in CSS px. */
export interface PrismaPlacedGlyph {
  glyphIndex: number;
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** RGB bytes of the glyph's colour. */
  color: [number, number, number];
}

export interface PrismaLineLayout {
  font: string;
  fontPx: number;
  glyphs: PrismaPlacedGlyph[];
  bounds: { x: number; y: number; width: number; height: number };
}

/** The pieces of a rasterized line: centres in CSS px, and which placed glyph each belongs to. */
export interface PrismaTiles {
  count: number;
  x: Float32Array;
  y: Float32Array;
  glyph: Uint16Array;
  tileWidth: number;
  tileHeight: number;
}

export interface PrismaBatchEnd {
  line: PrismaLine;
  layout: PrismaLineLayout;
  tiles: PrismaTiles;
}

/** Instance data for one flight; see PRISMA_BATCH_STRIDE for its layout. */
export interface PrismaBatchData {
  buffer: ArrayBuffer;
  count: number;
  /** Shards are on screen between these times. */
  from: number;
  to: number;
  fromTile: [number, number];
  toTile: [number, number];
}

/** How one flight moves: which shape, and which way it goes (-1 or 1). */
export interface PrismaMotion {
  motion: number;
  turn: number;
}
