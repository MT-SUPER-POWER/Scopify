import { describe, expect, test } from "bun:test";

import {
  SONNET_CAMERA_BREATH_MAX_OFFSET,
  SONNET_CAMERA_BREATH_MAX_ROTATION,
  SONNET_CAMERA_BREATH_MAX_SCALE,
  resolveSonnetBreathWeight,
  resolveSonnetCameraBreath,
  resolveSonnetSmoothedCameraFocus,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetMotion";

describe("Sonnet v2 camera motion", () => {
  test("keeps the post-reveal breath deterministic and safely bounded", () => {
    for (const phase of [0, 1.3, 4.2]) {
      for (let step = 0; step <= 30; step += 1) {
        const time = step * 0.37;
        const breath = resolveSonnetCameraBreath(time, phase);
        expect(breath).toEqual(resolveSonnetCameraBreath(time, phase));
        expect(Math.abs(breath.x)).toBeLessThanOrEqual(SONNET_CAMERA_BREATH_MAX_OFFSET + 1e-9);
        expect(Math.abs(breath.y)).toBeLessThanOrEqual(SONNET_CAMERA_BREATH_MAX_OFFSET + 1e-9);
        expect(Math.abs(breath.scale)).toBeLessThanOrEqual(SONNET_CAMERA_BREATH_MAX_SCALE + 1e-9);
        expect(Math.abs(breath.rotation)).toBeLessThanOrEqual(
          SONNET_CAMERA_BREATH_MAX_ROTATION + 1e-9,
        );
      }
    }
    expect(resolveSonnetBreathWeight(8, 8)).toBe(0);
    expect(resolveSonnetBreathWeight(8.6, 8)).toBeGreaterThan(0);
    expect(resolveSonnetBreathWeight(9.2, 8)).toBe(1);
  });

  test("smooths continuous focus but preserves hard composition cuts", () => {
    const continuous = (time: number) => ({ x: time * time, y: time });
    const discontinuous = (time: number) => ({ x: time < 1 ? -300 : 300, y: 0 });

    expect(resolveSonnetSmoothedCameraFocus(1, 0, 2, continuous, 0.2)).toEqual(
      resolveSonnetSmoothedCameraFocus(1, 0, 2, continuous, 0.2),
    );
    expect(resolveSonnetSmoothedCameraFocus(0.99, 0, 2, discontinuous)).toEqual({ x: -300, y: 0 });
    expect(resolveSonnetSmoothedCameraFocus(1, 0, 2, discontinuous)).toEqual({ x: 300, y: 0 });
  });
});
