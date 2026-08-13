import { expect, test } from "bun:test";

import { adaptVoiceLyricToNetease } from "@/lib/lyrics/voiceLyric";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import type { VoiceLyricDocument } from "@/types/api/voicelist";

test("maps voice sentence and syllable timings into Folia lyric lines", () => {
  const document: VoiceLyricDocument = {
    duration: 3_000,
    sents: [
      {
        beg: 1_000,
        end: 2_200,
        name: "你好",
        speaker: "speaker_0",
        sylls: [
          { beg: 1_000, end: 1_500, name: "你" },
          { beg: 1_500, end: 2_200, name: "好" },
        ],
      },
    ],
  };

  const lyric = adaptNeteaseLyric(adaptVoiceLyricToNetease(document));

  expect(lyric.source).toBe("yrc");
  expect(lyric.isWordByWord).toBe(true);
  expect(lyric.lines).toHaveLength(1);
  expect(lyric.lines[0]).toMatchObject({
    endTimeMs: 2_200,
    startTimeMs: 1_000,
    text: "你好",
  });
  expect(lyric.lines[0]?.words).toEqual([
    { endTimeMs: 1_500, startTimeMs: 1_000, text: "你" },
    { endTimeMs: 2_200, startTimeMs: 1_500, text: "好" },
  ]);
});

test("skips malformed voice sentence ranges without failing lyric adaptation", () => {
  const lyric = adaptVoiceLyricToNetease({
    sents: [
      { beg: 5_000, end: 4_000, name: "invalid" },
      { beg: 1_000, end: 1_000, name: "valid" },
    ],
  });

  expect(lyric.yrc?.lyric).toBe("[1000,1](1000,1,0)valid");
});
