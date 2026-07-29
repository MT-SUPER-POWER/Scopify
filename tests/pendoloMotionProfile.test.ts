import { describe, expect, test } from "bun:test";

import {
  resolvePendoloChorusPresentation,
  resolvePendoloMotionProfile,
} from "@/components/lyrics/folia/src/components/visualizer/pendolo/pendoloMotionProfile";

describe("Pendolo motion profile", () => {
  test("orders calm, normal, and chaotic motion from restrained to energetic", () => {
    const calm = resolvePendoloMotionProfile("calm");
    const normal = resolvePendoloMotionProfile("normal");
    const chaotic = resolvePendoloMotionProfile("chaotic");

    expect(calm.balanceSpeedMultiplier).toBeLessThan(normal.balanceSpeedMultiplier);
    expect(normal.balanceSpeedMultiplier).toBeLessThan(chaotic.balanceSpeedMultiplier);
    expect(calm.balanceAmplitudeMultiplier).toBeLessThan(normal.balanceAmplitudeMultiplier);
    expect(normal.balanceAmplitudeMultiplier).toBeLessThan(chaotic.balanceAmplitudeMultiplier);
    expect(calm.chorusHaloOpacity).toBeLessThan(normal.chorusHaloOpacity);
    expect(normal.chorusHaloOpacity).toBeLessThanOrEqual(chaotic.chorusHaloOpacity);
  });

  test("falls back to normal and limits chorus emphasis to the active chorus line", () => {
    const normal = resolvePendoloMotionProfile("normal");
    expect(resolvePendoloMotionProfile(undefined)).toEqual(normal);
    expect(resolvePendoloMotionProfile("turbo")).toEqual(normal);
    expect(resolvePendoloChorusPresentation(true, true, normal).isActive).toBe(true);
    expect(resolvePendoloChorusPresentation(true, false, normal)).toMatchObject({
      glowMultiplier: 0,
      haloOpacity: 0,
      isActive: false,
    });
    expect(resolvePendoloChorusPresentation(false, true, normal).isActive).toBe(false);
  });
});
