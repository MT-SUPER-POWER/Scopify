import { describe, expect, it } from "bun:test";

import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { findSourceChorusStartSec, getChorusMarkerFraction } from "@/lib/player/chorusMarkers";
import type { LyricData } from "@/types/lyrics/model";

function makeLyrics(texts: string[]): LyricData {
  return {
    isPureMusic: false,
    isWordByWord: false,
    lines: texts.map((text, index) => ({
      endTimeMs: (index + 1) * 4_000,
      startTimeMs: index * 4_000,
      text,
      words: [],
    })),
    metadata: {
      artist: "Artist",
      timedCredits: [],
      title: "Song",
    },
    raw: { code: 200 },
    source: "lrc",
  };
}

describe("progress bar chorus marker", () => {
  it("records source chorus origin and ranges when platform chorus ranges are present", () => {
    const foliaLyrics = adaptLyricDataToFolia(makeLyrics(["Verse", "Chorus start", "Chorus end"]), [
      { endTimeMs: 12_000, startTimeMs: 5_000 },
    ]);

    expect(foliaLyrics.lines[1]?.chorusOrigin).toBe("source");
    expect(foliaLyrics.sourceChorusRanges).toEqual([{ endTime: 12, startTime: 5 }]);
    expect(findSourceChorusStartSec(foliaLyrics)).toBe(5);
  });

  it("suppresses the tick when chorus lines were only guessed from repeated text", () => {
    const foliaLyrics = adaptLyricDataToFolia(makeLyrics(["Intro", "Hook", "Verse", "Hook"]), []);

    expect(foliaLyrics.lines[1]?.isChorus).toBe(true);
    expect(foliaLyrics.lines[1]?.chorusOrigin).toBe("text");
    expect(foliaLyrics.sourceChorusRanges).toBeUndefined();
    expect(findSourceChorusStartSec(foliaLyrics)).toBeNull();
  });

  it("falls back to platform chorus ranges when lyric lines are absent", () => {
    expect(
      findSourceChorusStartSec(null, [
        { endTimeMs: 95_000, startTimeMs: 65_000 },
        { endTimeMs: 55_000, startTimeMs: 32_000 },
      ]),
    ).toBe(32);
  });

  it("applies lyric timeline offset and suppresses edge ticks within 1% of either end", () => {
    expect(getChorusMarkerFraction(30, 2_000, 100)).toBeCloseTo(0.32, 6);
    expect(getChorusMarkerFraction(0.5, 0, 100)).toBeNull();
    expect(getChorusMarkerFraction(99.5, 0, 100)).toBeNull();
  });
});
