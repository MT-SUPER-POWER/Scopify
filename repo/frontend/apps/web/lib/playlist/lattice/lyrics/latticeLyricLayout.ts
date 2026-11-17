import type {
  MeasureText,
  LatticeTypography,
  LyricPiece,
  LatticeLineLayout,
  LatticeLyricInput,
} from "@/types/playlist/latticeLyrics";
import type { Line } from "@/components/lyrics/folia/src/types";
import {
  buildMonetDisplayTokens,
  splitMonetGraphemes,
  type MonetDisplayToken,
} from "@/components/lyrics/folia/src/components/visualizer/monet/monetLyricsModel";
import {
  resolveThemeFontStack,
  resolveThemeTranslationFontStack,
  resolveThemeFontWeight,
} from "@/components/lyrics/folia/src/utils/fontStacks";
import { resolveLyricTextDirection } from "@/components/lyrics/folia/src/utils/lyrics/textDirection";

import { resolveMonetFillWidth } from "./monetLyricMotion";

// src/components/app/lattice/lyrics/latticeLyricLayout.ts

export const showsLatticeTranslation = (input: LatticeLyricInput) =>
  input.showSubtitleTranslation !== false &&
  !input.hideTranslationSubtitle &&
  input.subtitleContentMode !== "none";

/** Fits a fixed lyric budget, never the current sentence, so line changes cannot pump the font size. */
export function resolveLatticeTypography(
  input: LatticeLyricInput,
  width: number,
  height: number,
  measure: MeasureText,
) {
  const family = resolveThemeFontStack(input.theme);
  const translationFamily = resolveThemeTranslationFontStack(input.subtitleTheme ?? input.theme);
  const weight = resolveThemeFontWeight(input.theme, 600);
  const translationWeight = resolveThemeFontWeight(input.subtitleTheme ?? input.theme, 500);
  const showTranslation = showsLatticeTranslation(input);
  let fontPx = 24;
  for (let size = 64; size >= 24; size--) {
    const main = measure("国Agyp", `${weight} ${size}px ${family}`);
    const sub = measure("国Agyp", `${translationWeight} ${size * 0.5}px ${translationFamily}`);
    const lineHeight = Math.max(size * 1.18, main.height + 2);
    const budget =
      lineHeight * (3 + 2 * 0.72) +
      size * 0.49 * 2 +
      size * 1.2 +
      (showTranslation ? Math.max(size * 0.5 * 1.35, sub.height + 2) * 2 + size * 0.3 : 0);
    if (budget <= height && main.width * 3 <= Math.max(0, width - size * 1.2)) {
      fontPx = size;
      break;
    }
  }
  const font = `${weight} ${fontPx}px ${family}`;
  const translationPx = fontPx * 0.5;
  const translationFont = `${translationWeight} ${translationPx}px ${translationFamily}`;
  return {
    fontPx,
    font,
    translationPx,
    translationFont,
    showTranslation,
    lineHeight: Math.max(fontPx * 1.18, measure("国Agyp", font).height + 2),
    translationLineHeight: Math.max(
      translationPx * 1.35,
      measure("国Agyp", translationFont).height + 2,
    ),
    padding: Math.ceil(fontPx * 0.6),
  };
}

/** Wraps at token boundaries; oversized tokens split only at grapheme boundaries, preserving their clock offsets. */
export function wrapLatticeTokens(
  tokens: MonetDisplayToken[],
  width: number,
  font: string,
  lineHeight: number,
  measure: MeasureText,
  translation = false,
  rtl = false,
): LyricPiece[] {
  const pieces: LyricPiece[] = [];
  let x = 0,
    row = 0;
  for (const token of tokens) {
    const glyphs = splitMonetGraphemes(token.text);
    const offsets = [0];
    for (let i = 1; i <= glyphs.length; i++)
      offsets.push(measure(glyphs.slice(0, i).join(""), font).width);
    const fullWidth = offsets.at(-1) ?? 0;
    if (!token.text.includes("\n") && x > 0 && x + fullWidth > width) {
      row++;
      x = 0;
    }
    let first = 0;
    while (first < glyphs.length) {
      if (glyphs[first] === "\n") {
        row++;
        x = 0;
        first++;
        continue;
      }
      let last = first + 1;
      while (
        last < glyphs.length &&
        glyphs[last] !== "\n" &&
        measure(glyphs.slice(first, last + 1).join(""), font).width + x <= width
      )
        last++;
      const text = glyphs.slice(first, last).join("");
      const pieceWidth = measure(text, font).width;
      pieces.push({
        text,
        x: rtl ? width - x - pieceWidth : x,
        y: row * lineHeight,
        width: pieceWidth,
        row,
        token,
        offsets,
        tokenOffset: offsets[first],
        translation,
        rtl,
      });
      x += pieceWidth;
      first = last;
      if (first < glyphs.length && glyphs[first] !== "\n") {
        row++;
        x = 0;
      }
    }
  }
  return pieces;
}

export function layoutLatticeLine(
  line: Line,
  type: LatticeTypography,
  width: number,
  measure: MeasureText,
  romanization: boolean,
) {
  const tokens = buildMonetDisplayTokens(line);
  const rtl = resolveLyricTextDirection(line.fullText) === "rtl";
  const pieces = wrapLatticeTokens(tokens, width, type.font, type.lineHeight, measure, false, rtl);
  const rows = (pieces.at(-1)?.row ?? 0) + 1;
  const translation = type.showTranslation
    ? romanization
      ? line.romanization
      : line.translation
    : "";
  const subToken: MonetDisplayToken = {
    text: translation ?? "",
    timed: false,
    startTime: null,
    endTime: null,
    key: "translation",
    startOffset: 0,
    endOffset: translation?.length ?? 0,
    graphemeTimings: [],
  };
  const translationRtl = resolveLyricTextDirection(subToken.text) === "rtl";
  const sub = translation
    ? wrapLatticeTokens(
        [subToken],
        width,
        type.translationFont,
        type.translationLineHeight,
        measure,
        true,
        translationRtl,
      ).filter((piece) => piece.row < 2)
    : [];
  const textHeight = rows * type.lineHeight;
  for (const piece of sub) piece.y += textHeight + type.fontPx * 0.3;
  // Keep subtitle reading order while aligning it with the main lyric column.
  if (translationRtl !== rtl) {
    const edges = new Map<number, number>();
    for (const piece of sub) {
      const edge = edges.get(piece.row);
      edges.set(
        piece.row,
        rtl ? Math.max(edge ?? 0, piece.x + piece.width) : Math.min(edge ?? width, piece.x),
      );
    }
    for (const piece of sub) {
      piece.x += rtl ? width - (edges.get(piece.row) ?? width) : -(edges.get(piece.row) ?? 0);
    }
  }
  return {
    pieces: [...pieces, ...sub],
    rows,
    textHeight,
    width,
    rtl,
    height:
      textHeight +
      (sub.length
        ? type.fontPx * 0.3 + ((sub.at(-1)?.row ?? 0) + 1) * type.translationLineHeight
        : 0),
  };
}

/** Follows the timed row in an oversized active block without changing font size or dropping text. */
export function resolveLatticeLongLineOffset(
  layout: LatticeLineLayout,
  time: number,
  available: number,
  lineHeight: number,
) {
  if (layout.height <= available) return 0;
  const timed = layout.pieces.filter((p) => !p.translation && p.token.timed);
  let active = timed[0];
  for (const piece of timed) {
    const start = piece.token.startTime ?? Infinity,
      end = piece.token.endTime ?? Infinity;
    if (time < start) break;
    const front = resolveMonetFillWidth(
      time,
      start,
      end,
      piece.offsets,
      piece.token.graphemeTimings,
    );
    if (front >= piece.tokenOffset) active = piece;
    if (time <= end && front < piece.tokenOffset + piece.width) break;
  }
  return Math.min(
    Math.max(0, layout.height - available),
    Math.max(0, (active?.y ?? 0) - available * 0.46 + lineHeight / 2),
  );
}
