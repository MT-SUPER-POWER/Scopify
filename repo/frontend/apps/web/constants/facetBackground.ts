import type {
  FacetBackgroundTuning,
  FacetQuality,
  FacetQualitySettings,
} from "@/types/lyrics/facet/background";

export const DEFAULT_FACET_BACKGROUND_TUNING: FacetBackgroundTuning = {
  quality: "balanced",
  musicEnabled: true,
  strength: 1,
  overlayOpacity: 0.3,
  frameRate: "30",
};

export const FACET_SHADER_BASE_URL = "/folia/facet";

/**
 * The cost grows with pixels x samples x turns x ripples, and mostly inside the hexagon. The internal size does not
 * follow the display: the image is grainy by design, so upscaling hides well.
 */
export const FACET_QUALITY: Record<FacetQuality, FacetQualitySettings> = {
  performance: { maxPixels: 768 * 432, samples: 1, turns: 5, ripples: 3, bloom: false },
  balanced: { maxPixels: 960 * 540, samples: 2, turns: 6, ripples: 3, bloom: true },
  high: { maxPixels: 1280 * 720, samples: 3, turns: 7, ripples: 5, bloom: true },
};

/** Steps down the internal size, in order, when the GPU keeps missing the frame budget. */
export const FACET_ADAPTIVE_SCALES = [1, 0.75, 0.5] as const;
/** A rendered frame counts as late when it took this many frame budgets. */
export const FACET_LATE_FRAME_RATIO = 1.4;
/** How many rendered frames one verdict covers, and the share of late ones that steps down. */
export const FACET_ADAPTIVE_WINDOW = 90;
export const FACET_ADAPTIVE_LATE_SHARE = 0.35;
/** Longer gaps are the page being throttled or a pause, not the GPU falling behind. */
export const FACET_ADAPTIVE_IGNORE_MS = 500;
export const FACET_FADE_SECONDS = 0.6;
/** How much of the previous frame each frame keeps: stands in for the samples the original takes per pixel. */
export const FACET_HISTORY_WEIGHT = 0.6;
/** A stopped frame has no history to lean on, and only renders once. */
export const FACET_STILL_SAMPLES = 8;
