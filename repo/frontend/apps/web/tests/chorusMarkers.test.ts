import { expect, test } from "bun:test";

import { getChorusProgressRanges } from "@/lib/player/chorusMarkers";

test("maps chorus intervals to sorted playbar percentage ranges", () => {
  expect(
    getChorusProgressRanges(
      [
        { endTimeMs: 145_000, startTimeMs: 125_000 },
        { endTimeMs: 45_000, startTimeMs: 25_000 },
      ],
      200_000,
    ),
  ).toEqual([
    { endPercent: 22.5, startPercent: 12.5 },
    { endPercent: 72.5, startPercent: 62.5 },
  ]);
});

test("deduplicates chorus ranges and clips them to the song duration", () => {
  const ranges = getChorusProgressRanges(
    [
      { endTimeMs: 40_000, startTimeMs: 20_000 },
      { endTimeMs: 40_000, startTimeMs: 20_000 },
      { endTimeMs: 130_000, startTimeMs: 110_000 },
      { endTimeMs: 5_000, startTimeMs: Number.NaN },
    ],
    120_000,
  );

  expect(ranges).toHaveLength(2);
  expect(ranges[0]?.startPercent).toBeCloseTo(100 / 6);
  expect(ranges[0]?.endPercent).toBeCloseTo(100 / 3);
  expect(ranges[1]?.startPercent).toBeCloseTo(1100 / 12);
  expect(ranges[1]?.endPercent).toBe(100);
  expect(getChorusProgressRanges([], 0)).toEqual([]);
});
