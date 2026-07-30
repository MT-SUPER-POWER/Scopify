import { expect, test } from "bun:test";

import { normalizeSongChorusRanges } from "@/lib/lyrics/chorusRanges";

test("normalizes valid NetEase chorus ranges and rejects malformed intervals", () => {
  expect(
    normalizeSongChorusRanges({
      code: 200,
      chorus: [
        { startTime: 9_000, endTime: 13_000 },
        { startTime: Number.NaN, endTime: 15_000 },
        { startTime: 20_000, endTime: 19_000 },
      ],
    }),
  ).toEqual([{ startTimeMs: 9_000, endTimeMs: 13_000 }]);

  expect(
    normalizeSongChorusRanges({
      code: 200,
      data: [{ startTime: 21_000, endTime: 25_000 }],
    }),
  ).toEqual([{ startTimeMs: 21_000, endTimeMs: 25_000 }]);
  expect(normalizeSongChorusRanges({ code: 500, chorus: [] })).toEqual([]);
});
