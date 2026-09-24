// src/components/visualizer/tempera/temperaMeasure.ts
// pretext-backed text metrics for the Tempera collage. Words come from the Intl.Segmenter
// split done at compile time; measuring the whole word and then normalising the per-grapheme
// advances to that width keeps shaping/kerning intact while still allowing per-char placement.
export interface TemperaMeasureContext {
  cache: Map<string, number>;
  fontFamily: string;
  fontWeight: number;
}

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
