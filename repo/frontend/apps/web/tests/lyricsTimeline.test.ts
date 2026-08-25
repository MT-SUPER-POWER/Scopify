import { describe, expect, test } from "bun:test";

import { applyLyricOffsetMs } from "@/lib/lyrics/timeline";

describe("lyrics timeline", () => {
  test("delays the lyric clock for a positive global offset", () => {
    expect(applyLyricOffsetMs(10_000, 350)).toBe(9_650);
  });

  test("advances the lyric clock for a negative global offset", () => {
    expect(applyLyricOffsetMs(10_000, -350)).toBe(10_350);
  });
});
