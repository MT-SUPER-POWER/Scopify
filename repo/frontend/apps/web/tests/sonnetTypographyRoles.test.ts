import { describe, expect, test } from "bun:test";

import {
  findSonnetHeroSegmentIndex,
  findSonnetSemiHeroSegmentIndex,
  isSonnetEmphasisRole,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetTypographyRoles";
import type { SonnetSemanticSegment } from "@/components/lyrics/folia/src/components/visualizer/sonnet/types";

const segment = (text: string, index: number): SonnetSemanticSegment => ({
  text,
  startOffset: index * 10,
  endOffset: index * 10 + text.length,
  startTime: index,
  endTime: index + 1,
  wordIndices: [index],
  graphemes: Array.from(text, (char) => ({ char, startTime: index, endTime: index + 1 })),
  isWordLike: true,
});

describe("Sonnet typography roles", () => {
  test("adds a secondary emphasis to a long line while preserving hierarchy", () => {
    const segments = [
      "在",
      "漫长",
      "句子",
      "前部重点",
      "仍然",
      "不断",
      "延伸",
      "最终的核心词语",
    ].map(segment);
    const hero = findSonnetHeroSegmentIndex(segments);
    const semiHero = findSonnetSemiHeroSegmentIndex(segments, hero);

    expect(hero).toBe(7);
    expect(semiHero).toBe(3);
    expect(isSonnetEmphasisRole("hero")).toBe(true);
    expect(isSonnetEmphasisRole("semi-hero")).toBe(true);
    expect(isSonnetEmphasisRole("support")).toBe(false);
  });

  test("does not force a semi-hero into a short line", () => {
    const segments = ["一", "二", "三", "核心词语"].map(segment);
    expect(findSonnetSemiHeroSegmentIndex(segments, findSonnetHeroSegmentIndex(segments))).toBe(-1);
  });
});
