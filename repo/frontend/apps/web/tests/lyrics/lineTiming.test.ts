import { describe, expect, it } from "bun:test";

import { buildMonetDisplayTokens } from "@/components/lyrics/folia/src/components/visualizer/monet/monetLyricsModel";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";

describe("line-level lyric timing", () => {
  it("estimates YRC words for line timestamps while preserving written word timings", () => {
    const lyric = adaptNeteaseLyric({
      code: 200,
      yrc: {
        lyric: "[1000,3000]世界 🧑🏼‍🎤演唱\n[4000,2000](4200,300,0)声  (4500,500,0)音",
        version: 1,
      },
    });

    const [estimated, timed] = lyric.lines;
    expect(estimated).toMatchObject({
      startTimeMs: 1_000,
      endTimeMs: 4_000,
      text: "世界 🧑🏼‍🎤演唱",
    });
    expect(estimated.words.map((word) => word.text)).toEqual(["世", "界", "🧑🏼‍🎤", "演", "唱"]);
    expect(estimated.words[0].startTimeMs).toBe(1_000);
    expect(estimated.words[1].startTimeMs).toBeGreaterThan(1_000);
    expect(estimated.words.at(-1)?.endTimeMs).toBeLessThanOrEqual(4_000);
    expect(timed.words).toEqual([
      { text: "声  ", startTimeMs: 4_200, endTimeMs: 4_500 },
      { text: "音", startTimeMs: 4_500, endTimeMs: 5_000 },
    ]);
  });

  it("estimates separate Monet sweep tokens for a line without words", () => {
    const line = { startTime: 10, endTime: 16, fullText: "世界  音乐 again", words: [] };
    const tokens = buildMonetDisplayTokens(line);
    const timed = tokens.filter((token) => token.timed);

    expect(tokens.map((token) => token.text).join("")).toBe(line.fullText);
    expect(timed.map((token) => token.text)).toEqual(["世", "界", "音", "乐", "again"]);
    expect(timed[0].startTime).toBe(10);
    expect(timed[1].startTime).toBeGreaterThan(10);
    expect(timed.at(-1)?.endTime).toBeLessThanOrEqual(16);
  });

  it("splits a whole-line word within its original time span", () => {
    const line = {
      startTime: 10,
      endTime: 19,
      fullText: "wrap this lyric line  ",
      words: [{ text: "wrap this lyric line", startTime: 11, endTime: 17 }],
    };
    const tokens = buildMonetDisplayTokens(line);
    const timed = tokens.filter((token) => token.timed);

    expect(tokens.map((token) => token.text).join("")).toBe(line.fullText);
    expect(timed.map((token) => token.text)).toEqual(["wrap", "this", "lyric", "line"]);
    expect(timed[0].startTime).toBe(11);
    expect(timed.at(-1)?.endTime).toBeCloseTo(17);
  });

  it("retains the timing of authored syllables in a single word", () => {
    const tokens = buildMonetDisplayTokens({
      startTime: 1,
      endTime: 4,
      fullText: "爱音乐",
      words: [
        {
          text: "爱音乐",
          startTime: 1,
          endTime: 4,
          syllables: [
            { text: "爱", startTime: 1, endTime: 1.5 },
            { text: "音", startTime: 2, endTime: 2.5 },
            { text: "乐", startTime: 2.5, endTime: 4 },
          ],
        },
      ],
    });

    expect(tokens.map((token) => token.text)).toEqual(["爱音乐"]);
    expect(tokens[0].graphemeTimings.map((glyph) => glyph.startTime)).toEqual([1, 2, 2.5]);
  });
});
