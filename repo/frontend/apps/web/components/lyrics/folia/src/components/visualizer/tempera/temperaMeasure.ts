import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import type { TemperaSegment } from "./types";

// src/components/visualizer/tempera/temperaMeasure.ts
// pretext-backed text metrics for the Tempera collage. Words come from the Intl.Segmenter
// split done at compile time; measuring the whole word and then normalising the per-grapheme
// advances to that width keeps shaping/kerning intact while still allowing per-char placement.
export interface TemperaMeasureContext {
  cache: Map<string, number>;
  fontFamily: string;
  fontWeight: number;
}

export const createTemperaMeasureContext = (
  fontFamily: string,
  fontWeight: number,
): TemperaMeasureContext => ({ cache: new Map(), fontFamily, fontWeight });

const measureText = (ctx: TemperaMeasureContext, text: string, fontSize: number) => {
  const fontSpec = `${ctx.fontWeight} ${fontSize}px ${ctx.fontFamily}`;
  const key = `${fontSpec}|${text}`;
  const cached = ctx.cache.get(key);
  if (cached !== undefined) return cached;
  let measured: number;
  try {
    const layout = layoutWithLines(prepareWithSegments(text, fontSpec), 99999, fontSize * 1.2);
    measured = layout.lines[0]?.width ?? text.length * fontSize * 0.6;
  } catch {
    measured = text.length * fontSize * 0.6;
  }
  const width = Math.max(fontSize * 0.08, measured);
  ctx.cache.set(key, width);
  return width;
};

export const measureTemperaGrapheme = (
  ctx: TemperaMeasureContext,
  char: string,
  fontSize: number,
) => (char.trim().length === 0 ? fontSize * 0.3 : measureText(ctx, char, fontSize));

export interface TemperaWordGlyph {
  char: string;
  startTime: number;
  endTime: number;
  /** Advance from the word's left edge to this glyph's left edge. */
  offset: number;
  width: number;
}

export interface TemperaWordUnit {
  lineIndex: number;
  segmentIndex: number;
  text: string;
  /** Source offsets, used to tell a real space from a mere segmentation boundary. */
  startOffset: number;
  endOffset: number;
  /** Horizontal space to insert before this word, in pixels. */
  leadingGap: number;
  /** Multiplier on the shot's base font size; the hierarchy accent lives here. */
  scale: number;
  width: number;
  glyphs: TemperaWordGlyph[];
  startTime: number;
  endTime: number;
}

// Measures one word and lays its graphemes out inside the shaped width, so the sum of the
// per-glyph advances always equals what pretext reports for the whole word.
export const buildTemperaWordUnit = (
  ctx: TemperaMeasureContext,
  segment: TemperaSegment,
  lineIndex: number,
  segmentIndex: number,
  fontSize: number,
  scale: number,
): TemperaWordUnit | null => {
  const glyphs = segment.graphemes.filter((grapheme) => grapheme.char.length > 0);
  if (glyphs.length === 0) return null;
  const scaledSize = fontSize * scale;
  const raw = glyphs.map((grapheme) => measureTemperaGrapheme(ctx, grapheme.char, scaledSize));
  const rawTotal = raw.reduce((sum, value) => sum + value, 0);
  const shaped = measureText(ctx, segment.text.replace(/\s+$/u, ""), scaledSize);
  // Distribute the shaping difference proportionally instead of nudging a single glyph.
  const correction = rawTotal > 0 ? shaped / rawTotal : 1;
  let offset = 0;
  const placed = glyphs.map((grapheme, index) => {
    const width = raw[index] * correction;
    const glyph = {
      char: grapheme.char,
      startTime: grapheme.startTime,
      endTime: grapheme.endTime,
      offset,
      width,
    };
    offset += width;
    return glyph;
  });
  return {
    lineIndex,
    segmentIndex,
    text: segment.text,
    startOffset: segment.startOffset,
    endOffset: segment.endOffset,
    leadingGap: 0,
    scale,
    width: offset,
    glyphs: placed,
    startTime: placed[0].startTime,
    endTime: placed[placed.length - 1].endTime,
  };
};
