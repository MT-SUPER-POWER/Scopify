import { at } from "./at";
import type { PrismaLine, PrismaLineLayout, PrismaPlacedGlyph } from "@/types/lyrics/prisma/model";

// lib/lyrics/prisma/layout.ts
// Places one line: as large as it fits, wrapped into balanced rows, centred slightly above the middle so
// the subtitle overlay stays clear. Short lines get big type, long ones wrap and shrink.

const MAX_ROWS = 3;
const LINE_HEIGHT = 1.26;
const SHRINK_STEP = 0.9;
/** Never start a row with these; they stay with the grapheme before them. */
const NO_ROW_START = /^[，。！？、；：,.!?;:)\]}）》」』”’…—]$/;
const CJK = /[぀-ヿ㐀-鿿豈-﫿가-힯]/;

export interface PrismaLayoutOptions {
  width: number;
  height: number;
  fontScale: number;
  fontStack: string;
  fontWeight: number;
  colorOf: (line: PrismaLine, glyphIndex: number) => [number, number, number];
  measure: (font: string, char: string) => number;
}

const isSpace = (char: string) => char.trim().length === 0;

/** Groups grapheme indices into pieces that must not break: a Latin word, or a CJK char with its punctuation. */
const buildTokens = (line: PrismaLine) => {
  const tokens: number[][] = [];
  let current: number[] = [];
  const flush = () => {
    if (current.length) tokens.push(current);
    current = [];
  };
  line.glyphs.forEach((glyph, index) => {
    if (isSpace(glyph.char)) {
      flush();
      tokens.push([index]);
      return;
    }
    if (NO_ROW_START.test(glyph.char)) {
      current.push(index);
      return;
    }
    if (
      CJK.test(glyph.char) ||
      (current.length && CJK.test(at(line.glyphs, at(current, 0)).char))
    ) {
      flush();
    }
    current.push(index);
  });
  flush();
  return tokens;
};

const isSpaceToken = (line: PrismaLine, token: number[]) =>
  token.length === 1 && isSpace(at(line.glyphs, at(token, 0)).char);

const wrapTokens = (
  line: PrismaLine,
  tokens: number[][],
  widthOf: (token: number[]) => number,
  maxWidth: number,
) => {
  const total = tokens.reduce((sum, token) => sum + widthOf(token), 0);
  const rowsNeeded = Math.max(1, Math.ceil(total / maxWidth));
  const target = Math.min(maxWidth, (total / rowsNeeded) * 1.04);
  const rows: number[][][] = [];
  let row: number[][] = [];
  let rowWidth = 0;
  for (const token of tokens) {
    const width = widthOf(token);
    if (row.length && rowWidth + width > target && !isSpaceToken(line, token)) {
      rows.push(row);
      row = [];
      rowWidth = 0;
    }
    if (!row.length && isSpaceToken(line, token)) continue;
    row.push(token);
    rowWidth += width;
  }
  if (row.length) rows.push(row);
  return rows.map((tokensInRow) => {
    const trimmed = [...tokensInRow];
    while (trimmed.length && isSpaceToken(line, at(trimmed, trimmed.length - 1))) trimmed.pop();
    return trimmed;
  });
};

export const layoutPrismaLine = (
  line: PrismaLine,
  options: PrismaLayoutOptions,
): PrismaLineLayout => {
  const { width, height, fontScale, fontStack, fontWeight, measure } = options;
  const maxWidth = width * 0.84;
  const maxHeight = height * 0.56;
  const tokens = buildTokens(line);
  const largest = Math.min(width * 0.1, height * 0.2) * fontScale;
  const smallest = Math.max(18, largest * 0.34);

  let fontPx = largest;
  let font = "";
  let rows: number[][][] = [];
  let advances: number[] = [];
  for (;;) {
    const candidate = `${fontWeight} ${fontPx}px ${fontStack}`;
    const candidateAdvances = line.glyphs.map((glyph) => measure(candidate, glyph.char));
    const widthOf = (token: number[]) =>
      token.reduce((sum, index) => sum + at(candidateAdvances, index), 0);
    font = candidate;
    advances = candidateAdvances;
    rows = wrapTokens(line, tokens, widthOf, maxWidth);
    const fitsHeight = rows.length * fontPx * LINE_HEIGHT <= maxHeight;
    const fitsWidth = rows.every(
      (row) => row.reduce((sum, token) => sum + widthOf(token), 0) <= maxWidth,
    );
    if ((rows.length <= MAX_ROWS && fitsHeight && fitsWidth) || fontPx <= smallest) break;
    fontPx = Math.max(smallest, fontPx * SHRINK_STEP);
  }

  const rowHeight = fontPx * LINE_HEIGHT;
  const blockHeight = rows.length * rowHeight;
  const top = Math.max(height * 0.06, height * 0.45 - blockHeight / 2);
  const glyphs: PrismaPlacedGlyph[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  rows.forEach((row, rowIndex) => {
    const indices = row.flat();
    const rowWidth = indices.reduce((sum, index) => sum + at(advances, index), 0);
    let x = (width - rowWidth) / 2;
    const y = top + rowIndex * rowHeight;
    for (const index of indices) {
      const advance = at(advances, index);
      const glyph = at(line.glyphs, index);
      if (!isSpace(glyph.char)) {
        glyphs.push({
          glyphIndex: index,
          char: glyph.char,
          x,
          y,
          width: advance,
          height: rowHeight,
          color: options.colorOf(line, index),
        });
      }
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + advance);
      x += advance;
    }
  });
  return {
    font,
    fontPx,
    glyphs,
    bounds: {
      x: Number.isFinite(minX) ? minX : 0,
      y: top,
      width: Number.isFinite(minX) ? maxX - minX : 0,
      height: blockHeight,
    },
  };
};
