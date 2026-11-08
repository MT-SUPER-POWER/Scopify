import { expect, test } from "bun:test";
import { estimateDisplayRefreshRate } from "../../lib/settings/displayRefreshRate";

test("estimates common and high refresh rates without assuming 60 Hz", () => {
  for (const hz of [30, 60, 90, 120, 144, 165, 240]) {
    const timestamps = Array.from({ length: 41 }, (_, index) => (index * 1000) / hz);
    expect(estimateDisplayRefreshRate(timestamps)).toBe(hz);
  }
});

test("an occasional missed frame does not halve the estimated rate", () => {
  const timestamps = Array.from(
    { length: 41 },
    (_, index) => ((index + (index >= 20 ? 1 : 0)) * 1000) / 120,
  );
  expect(estimateDisplayRefreshRate(timestamps)).toBe(120);
});

test("does not fabricate a reading from insufficient, paused or invalid samples", () => {
  expect(estimateDisplayRefreshRate([0, 16, 32])).toBeNull();
  expect(estimateDisplayRefreshRate(Array.from({ length: 41 }, () => 0))).toBeNull();
  expect(
    estimateDisplayRefreshRate(Array.from({ length: 41 }, (_, index) => index * 1000)),
  ).toBeNull();
  const timestamps = Array.from({ length: 41 }, (_, index) => (index * 1000) / 60);
  timestamps[20] = Number.NaN;
  expect(estimateDisplayRefreshRate(timestamps)).toBeNull();
});
