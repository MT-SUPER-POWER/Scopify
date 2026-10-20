import { describe, expect, test } from "bun:test";

import { computeCurvedTrackLayout, placeOnCylinder } from "@/lib/marketing/curved-track";

describe("landing curved track", () => {
  test("keeps the panel at the centre of the screen flat and in place", () => {
    const { angle, transform } = placeOnCylinder(0, 1000);
    expect(angle).toBe(0);
    expect(transform).toContain("translate3d(0.00px, 0px, 0.00px)");
  });

  test("bends both sides symmetrically toward the viewer", () => {
    const left = placeOnCylinder(-400, 1000);
    const right = placeOnCylinder(400, 1000);
    expect(left.angle).toBeCloseTo(-right.angle);
    // 两侧都向观众靠近（z > 0），并转向圆柱轴。
    expect(right.transform).toMatch(
      /translate3d\([\d.]+px, 0px, [1-9][\d.]*px\) rotateY\(-0\.4000rad\)/,
    );
    expect(left.transform).toMatch(
      /translate3d\(-[\d.]+px, 0px, [1-9][\d.]*px\) rotateY\(0\.4000rad\)/,
    );
  });

  test("lays cards out along the arc and ends with the last card centred", () => {
    const layout = computeCurvedTrackLayout(1440, 900, 6);
    expect(layout.cardCenters).toHaveLength(6);
    expect(layout.travel).toBe(layout.cardCenters.at(-1)!);
    expect(layout.cardCenters[0]! - layout.cardWidth / 2).toBeGreaterThan(
      layout.introCenter + layout.introWidth / 2,
    );
    expect(layout.cardWidth / layout.stripCount).toBeLessThanOrEqual(32);
    expect(layout.perspective).toBeGreaterThan(layout.radius);
  });
});
