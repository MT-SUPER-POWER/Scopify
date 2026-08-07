import { describe, expect, test } from "bun:test";

import { resolveSonnetTypographyLayout } from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetTypographyLayout";
import type {
  SonnetSemanticSegment,
  SonnetShotKind,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/types";

const segment = (text: string, index: number): SonnetSemanticSegment => ({
  text,
  startOffset: index * 10,
  endOffset: index * 10 + text.length,
  startTime: index * 0.4,
  endTime: index * 0.4 + 0.35,
  wordIndices: [index],
  graphemes: Array.from(text, (char) => ({
    char,
    startTime: index * 0.4,
    endTime: index * 0.4 + 0.35,
  })),
  isWordLike: true,
});

const shotKinds: SonnetShotKind[] = [
  "editorial-column",
  "type-impact",
  "fragment-collage",
  "tracking-ribbon",
  "mask-reveal",
  "quiet-tableau",
  "poster-blocks",
];

describe("Sonnet v2 measured typography layout", () => {
  test("keeps long multi-line English shots finite and collision-free", () => {
    let index = 0;
    const lines = [
      "And the face of the human cannonball".split(" ").map((word) => segment(word, index++)),
      "That I need to I want to".split(" ").map((word) => segment(word, index++)),
    ];

    shotKinds.forEach((shotKind) => {
      const layout = resolveSonnetTypographyLayout({
        lines,
        shotKind,
        paragraphKind: "verse",
        width: 1280,
        height: 720,
        baseFontSize: 48,
        fontFamily: "sans-serif",
        fontWeight: 700,
      }).filter((item) => item.role !== "decoration");
      const atOrigin = layout.filter((item) => Math.abs(item.x) < 1 && Math.abs(item.y) < 1);

      expect(atOrigin.length).toBeLessThanOrEqual(1);
      layout.forEach((item) => {
        expect(Number.isFinite(item.x) && Number.isFinite(item.y)).toBe(true);
      });
      for (let firstIndex = 0; firstIndex < layout.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < layout.length; secondIndex += 1) {
          const first = layout[firstIndex];
          const second = layout[secondIndex];
          const horizontalGap =
            Math.abs(first.x - second.x) - (first.measuredWidth + second.measuredWidth) / 2;
          const verticalGap =
            Math.abs(first.y - second.y) - (first.measuredHeight + second.measuredHeight) / 2;
          expect(horizontalGap >= -0.5 || verticalGap >= -0.5).toBe(true);
        }
      }
    });
  });
});
