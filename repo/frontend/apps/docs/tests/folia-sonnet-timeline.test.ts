import { describe, expect, test } from "bun:test";

import { LANDING_SONNET_LOOP_DURATION } from "@/constants/marketing";
import { LANDING_SONNET_LINES, resolveLoopTime } from "@/lib/marketing/folia-sonnet-timeline";

describe("resolveLoopTime", () => {
  test("advances independently of page scroll", () => {
    expect(resolveLoopTime(4)).toBeGreaterThan(resolveLoopTime(2));
  });

  test("loops without exceeding the Sonnet duration", () => {
    expect(resolveLoopTime(LANDING_SONNET_LOOP_DURATION + 1.25)).toBe(1.25);
  });
});

describe("LANDING_SONNET_LINES", () => {
  test("fills one complete performance loop", () => {
    expect(LANDING_SONNET_LINES.at(-1)?.endTime).toBe(LANDING_SONNET_LOOP_DURATION);
  });
});
