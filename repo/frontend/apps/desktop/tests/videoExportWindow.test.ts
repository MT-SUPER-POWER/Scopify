import { describe, expect, test } from "bun:test";

import { resolveVideoExportWindowBounds } from "../main/window/videoExportWindow";

describe("video export window sizing", () => {
  test("uses physical-pixel sizing and stays on the current display", () => {
    const bounds = resolveVideoExportWindowBounds({
      currentBounds: { x: 2200, y: 180, width: 1200, height: 800 },
      workArea: { x: 1920, y: 0, width: 2560, height: 1440 },
      scaleFactor: 1.5,
      target: { width: 1920, height: 1080 },
    });

    expect(bounds.x).toBeGreaterThanOrEqual(1920);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(4480);
    expect(bounds.width * 1.5).toBeGreaterThanOrEqual(1926);
    expect(bounds.height * 1.5).toBeGreaterThanOrEqual(1086);
    expect(Number.isInteger(bounds.x * 1.5)).toBe(true);
    expect(Number.isInteger(bounds.y * 1.5)).toBe(true);
  });

  test("keeps oversized portrait exports anchored to the selected display", () => {
    const bounds = resolveVideoExportWindowBounds({
      currentBounds: { x: -1700, y: 120, width: 1000, height: 720 },
      workArea: { x: -1920, y: 0, width: 1920, height: 1040 },
      scaleFactor: 1,
      target: { width: 1080, height: 1920 },
    });

    expect(bounds.x).toBeGreaterThanOrEqual(-1920);
    expect(bounds.x).toBeLessThan(0);
    expect(bounds.y).toBe(0);
    expect(bounds.height).toBeGreaterThan(1920);
  });
});
