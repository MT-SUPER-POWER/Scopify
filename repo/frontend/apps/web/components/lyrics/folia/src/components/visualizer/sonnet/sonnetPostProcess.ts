import type { SonnetTuning, Theme } from "../../../types";
import { createSonnetLensFilter } from "./sonnetLensFilter";
import { resolveSonnetAnimationScale } from "./sonnetMotion";
import { createSonnetPrintFilters, type SonnetPrintEffectAmounts } from "./sonnetPrintFilters";

// src/components/visualizer/sonnet/sonnetPostProcess.ts
// Builds PV style Post Processing (Noise, Color shifts, high contrast)
type PixiModule = typeof import("pixi.js");

export interface SonnetPostProcessProfile {
  glowStrength: number;
  glowAlpha: number;
  noise: number;
  contrast: number;
  glitchIntensity: number;
  lensDistortion: number;
  lensDispersion: number;
  printEffects: SonnetPrintEffectAmounts;
}

const NO_PRINT_EFFECTS: SonnetPrintEffectAmounts = {
  rgbShift: 0,
  halftone: 0,
  vignette: 0,
};

export const resolveSonnetPostProcessProfile = (
  theme: Theme,
  tuning: SonnetTuning,
  staticMode: boolean,
): SonnetPostProcessProfile => {
  if (staticMode) {
    return {
      glowStrength: 0,
      glowAlpha: 0,
      noise: 0,
      contrast: 0,
      glitchIntensity: 0,
      lensDistortion: 0,
      lensDispersion: 0,
      printEffects: NO_PRINT_EFFECTS,
    };
  }
  const motion = tuning.typographyMotion * resolveSonnetAnimationScale(theme);
  const postEnabled = tuning.postProcessEnabled;
  return {
    glowStrength: 2.8 + motion * 1.8,
    glowAlpha: Math.min(0.62, 0.28 + motion * 0.12),
    noise: postEnabled ? tuning.postProcessGrain * 0.35 : 0,
    contrast: postEnabled ? tuning.postProcessContrast * 0.5 : 0,
    glitchIntensity: 1, // Used during transitions
    lensDistortion: postEnabled ? tuning.postProcessLensDistortion : 0,
    lensDispersion: postEnabled ? tuning.postProcessLensDispersion : 0,
    printEffects: postEnabled
      ? {
          rgbShift: tuning.postProcessRgbShift,
          halftone: tuning.postProcessHalftone,
          vignette: tuning.postProcessVignette,
        }
      : NO_PRINT_EFFECTS,
  };
};

export const createSonnetHaloLayer = (pixi: PixiModule, profile: SonnetPostProcessProfile) => {
  const layer = new pixi.Container();
  const filters: import("pixi.js").Filter[] = [];
  if (profile.glowStrength > 0) {
    const blur = new pixi.BlurFilter({
      strength: profile.glowStrength,
      quality: 2,
      kernelSize: 5,
      resolution: 0.75,
    });
    layer.filters = [blur];
    layer.alpha = profile.glowAlpha;
    layer.blendMode = "screen";
    filters.push(blur);
  }
  return { layer, filters };
};

export const applySonnetScenePostProcess = (
  pixi: PixiModule,
  container: import("pixi.js").Container,
  profile: SonnetPostProcessProfile,
  seed: number,
) => {
  const filters: import("pixi.js").Filter[] = [];

  if (profile.lensDistortion > 0 || profile.lensDispersion > 0) {
    filters.push(
      createSonnetLensFilter(pixi, {
        distortion: profile.lensDistortion,
        dispersion: profile.lensDispersion,
      }),
    );
  }

  // Noise Filter for print/film grain texture
  if (profile.noise > 0) {
    const noise = new pixi.NoiseFilter({
      noise: profile.noise,
      seed: (seed % 10_000) / 10_000,
      antialias: "on",
    });
    filters.push(noise);
  }

  if (profile.contrast > 0) {
    const colorMatrix = new pixi.ColorMatrixFilter();
    colorMatrix.contrast(profile.contrast, false);
    colorMatrix.antialias = "on";
    filters.push(colorMatrix);
  }

  filters.push(...createSonnetPrintFilters(pixi, profile.printEffects));

  if (filters.length > 0) {
    container.filters = filters;
  }
  return filters;
};
