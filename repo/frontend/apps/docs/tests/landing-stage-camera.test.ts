import { describe, expect, test } from "bun:test";

import { approachScale, focusRingDetent } from "@/lib/marketing/landing-stage-camera";

describe("landing stage camera", () => {
  test("dollies from the distant scale to the target and grows faster up close", () => {
    expect(approachScale(0, 0.4, 1)).toBeCloseTo(0.4);
    expect(approachScale(1, 0.4, 1)).toBeCloseTo(1);
    expect(approachScale(2, 0.4, 1)).toBeCloseTo(1);
    const early = approachScale(0.5, 0.4, 1) - approachScale(0, 0.4, 1);
    const late = approachScale(1, 0.4, 1) - approachScale(0.5, 0.4, 1);
    expect(late).toBeGreaterThan(early);
  });

  test("keeps the focus ring continuous across detents while dwelling on each one", () => {
    expect(focusRingDetent(3)).toBe(3);
    expect(focusRingDetent(3.5)).toBeCloseTo(3.5);
    expect(focusRingDetent(3.4999)).toBeCloseTo(focusRingDetent(3.5001), 2);
    expect(Math.abs(focusRingDetent(3.1) - 3)).toBeLessThan(0.1);
  });
});
