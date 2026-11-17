import { describe, expect, it } from "bun:test";

import { layoutLatticeLine } from "@/lib/playlist/lattice/lyrics/latticeLyricLayout";
import type { LatticeTypography } from "@/types/playlist/latticeLyrics";

const typography: LatticeTypography = {
  fontPx: 32,
  font: "32px sans-serif",
  translationPx: 16,
  translationFont: "16px sans-serif",
  showTranslation: true,
  lineHeight: 40,
  translationLineHeight: 20,
  padding: 12,
};
const measure = (text: string) => ({ width: text.length * 10, height: 10 });

describe("Lattice lyric layout", () => {
  it("wraps timed RTL lyrics from the right and aligns LTR subtitles to the same edge", () => {
    const width = 60;
    const layout = layoutLatticeLine(
      {
        startTime: 1,
        endTime: 5,
        fullText: "שלום עולם",
        translation: "hello",
        words: [
          { text: "שלום ", startTime: 1, endTime: 3 },
          { text: "עולם", startTime: 3, endTime: 5 },
        ],
      },
      typography,
      width,
      measure,
      false,
    );
    const lyrics = layout.pieces.filter((piece) => !piece.translation);
    const subtitle = layout.pieces.find((piece) => piece.translation);

    expect(layout.rtl).toBe(true);
    expect(lyrics).toHaveLength(2);
    expect(lyrics.map((piece) => piece.row)).toEqual([0, 1]);
    expect(lyrics.map((piece) => piece.x + piece.width)).toEqual([width, width]);
    expect(lyrics.map((piece) => piece.token.startTime)).toEqual([1, 3]);
    expect(subtitle?.rtl).toBe(false);
    expect(subtitle?.x).toBe(10);
  });
});
