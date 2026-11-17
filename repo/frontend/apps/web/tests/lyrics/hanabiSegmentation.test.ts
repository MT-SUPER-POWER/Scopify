import { describe, expect, it } from "bun:test";

import {
  shotLine,
  sliceLine,
} from "@/components/lyrics/folia/src/components/visualizer/hanabi/program";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import {
  getDefaultLyricBoundaries,
  getLyricSegmentationLineKey,
  isValidLyricSegmentation,
} from "@/lib/lyrics/segmentation";
import type { LyricData, LyricDisplayLine } from "@/types/lyrics/model";

const line: LyricDisplayLine = {
  text: "君の夢へ",
  startTimeMs: 0,
  endTimeMs: 4_000,
  words: [
    { text: "君", startTimeMs: 0, endTimeMs: 1_000 },
    { text: "の", startTimeMs: 1_000, endTimeMs: 2_000 },
    { text: "夢", startTimeMs: 2_000, endTimeMs: 3_000 },
    { text: "へ", startTimeMs: 3_000, endTimeMs: 4_000 },
  ],
};

const lyrics: LyricData = {
  lines: [line],
  raw: { code: 200 },
  metadata: { timedCredits: [] },
  isPureMusic: false,
  isWordByWord: true,
  source: "yrc",
};

describe("Hanabi word boundaries", () => {
  it("attaches particles within a script run and preserves the source text", () => {
    const text = "君の夢へ，故事的结尾  again";
    const boundaries = getDefaultLyricBoundaries(text, true);
    expect(boundaries).toEqual(["君の", "夢へ", "，", "故事的", "结尾", "  ", "again"]);
    expect(boundaries.join("")).toBe(text);
  });

  it("refuses boundaries that would change a lyric or split a grapheme", () => {
    expect(isValidLyricSegmentation("A👩‍🚀B", ["A", "👩‍🚀", "B"])).toBe(true);
    expect(isValidLyricSegmentation("A👩‍🚀B", ["A👩", "‍🚀B"])).toBe(false);
    expect(isValidLyricSegmentation("同一首歌", ["同一首", "歌。"])).toBe(false);
  });

  it("applies a stored override without changing provider timing", () => {
    const adapted = adaptLyricDataToFolia(lyrics, [], {
      automatic: true,
      overrides: { [getLyricSegmentationLineKey(line)]: ["君の夢", "へ"] },
    }).lines[0];
    expect(adapted?.wordSegments).toEqual(["君の夢", "へ"]);
    expect(adapted?.autoWordSegments).toBeUndefined();
    expect(adapted?.words).toEqual(adaptLyricDataToFolia(lyrics).lines[0]?.words);
  });

  it("keeps word boundaries through cropped and joined Hanabi shots", () => {
    const first = adaptLyricDataToFolia(lyrics, [], {
      automatic: true,
      overrides: { [getLyricSegmentationLineKey(line)]: ["君の夢", "へ"] },
    }).lines[0];
    if (!first) throw new Error("Expected a line for the Hanabi shot");
    expect(sliceLine(first, 1, 4).wordSegments).toEqual(["の夢", "へ"]);

    const shots = shotLine(
      new Map([
        [0, first],
        [1, { ...first, startTime: 4, endTime: 8 }],
      ]),
      [
        { lineIndex: 0, startOffset: 0, endOffset: 2 },
        { lineIndex: 1, startOffset: 2, endOffset: 4 },
      ],
    );
    expect(shots?.fullText).toBe("君の 夢へ");
    expect(shots?.wordSegments).toEqual(["君の", " ", "夢", "へ"]);
  });
});
