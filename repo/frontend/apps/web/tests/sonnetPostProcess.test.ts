import { describe, expect, test } from "bun:test";

import { DEFAULT_SONNET_TUNING, type Theme } from "@/components/lyrics/folia/src/types";
import { resolveSonnetPostProcessProfile } from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetPostProcess";
import { normalizeFoliaStageSettings } from "@/lib/lyrics/foliaStageSettings";

// Locks Sonnet's opt-in post-process defaults, static-mode behavior, and persisted value ranges.
const theme = { animationIntensity: "normal" } as Theme;

describe("Sonnet post-processing", () => {
  test("keeps the full-scene effects disabled by default", () => {
    const profile = resolveSonnetPostProcessProfile(theme, DEFAULT_SONNET_TUNING, false);

    expect(DEFAULT_SONNET_TUNING.postProcessEnabled).toBe(false);
    expect(profile.noise).toBe(0);
    expect(profile.contrast).toBe(0);
    expect(profile.lensDistortion).toBe(0);
    expect(profile.lensDispersion).toBe(0);
    expect(profile.printEffects).toEqual({ rgbShift: 0, halftone: 0, vignette: 0 });
  });

  test("maps enabled settings into the ordered effect profile", () => {
    const profile = resolveSonnetPostProcessProfile(
      theme,
      {
        ...DEFAULT_SONNET_TUNING,
        postProcessEnabled: true,
        postProcessContrast: 0.8,
        postProcessHalftone: 0.4,
      },
      false,
    );

    expect(profile.noise).toBe(DEFAULT_SONNET_TUNING.postProcessGrain * 0.35);
    expect(profile.contrast).toBe(0.4);
    expect(profile.lensDistortion).toBe(DEFAULT_SONNET_TUNING.postProcessLensDistortion);
    expect(profile.lensDispersion).toBe(DEFAULT_SONNET_TUNING.postProcessLensDispersion);
    expect(profile.printEffects).toEqual({
      rgbShift: DEFAULT_SONNET_TUNING.postProcessRgbShift,
      halftone: 0.4,
      vignette: DEFAULT_SONNET_TUNING.postProcessVignette,
    });
  });

  test("suppresses every pass in static mode", () => {
    const profile = resolveSonnetPostProcessProfile(
      theme,
      { ...DEFAULT_SONNET_TUNING, postProcessEnabled: true },
      true,
    );

    expect(profile).toEqual({
      glowStrength: 0,
      glowAlpha: 0,
      noise: 0,
      contrast: 0,
      glitchIntensity: 0,
      lensDistortion: 0,
      lensDispersion: 0,
      printEffects: { rgbShift: 0, halftone: 0, vignette: 0 },
    });
  });

  test("migrates old settings and clamps imported lens values", () => {
    const migrated = normalizeFoliaStageSettings({
      tunings: { sonnet: { cameraIntensity: 1.25 } },
    });
    const clamped = normalizeFoliaStageSettings({
      tunings: {
        sonnet: {
          postProcessEnabled: true,
          postProcessLensDistortion: 9,
          postProcessLensDispersion: -2,
        },
      },
    });
    const migratedSonnet = migrated.tunings.sonnet;
    const clampedSonnet = clamped.tunings.sonnet;

    expect(migratedSonnet).toBeDefined();
    expect(clampedSonnet).toBeDefined();
    expect(migratedSonnet?.postProcessEnabled).toBe(false);
    expect(migratedSonnet?.postProcessLensDistortion).toBe(
      DEFAULT_SONNET_TUNING.postProcessLensDistortion,
    );
    expect(clampedSonnet?.postProcessEnabled).toBe(true);
    expect(clampedSonnet?.postProcessLensDistortion).toBe(2);
    expect(clampedSonnet?.postProcessLensDispersion).toBe(0);
  });
});
