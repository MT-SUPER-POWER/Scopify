import type { RhineBackgroundTuning, RhineQuality, RhineQualitySettings } from "@/types/rhineBackground";

export const DEFAULT_RHINE_BACKGROUND_TUNING: RhineBackgroundTuning = {
  colorMode: "auto",
  quality: "original",
  rhythmStyle: "legacy",
  musicEnabled: true,
  breathingEnabled: true,
  strength: 1,
  overlayOpacity: 0.2,
  frameRate: "30",
};

export const RHINE_MODEL_URL = "/folia/rhine/archive-cassette.glb";
export const RHINE_ROWS = 48;
export const RHINE_LANES = 9;
export const RHINE_LIFT = 4.05;
export const RHINE_SHOWCASE_TIMING = { rising: 0.9, holding: 1.2, returning: 1.1 } as const;
export const RHINE_QUALITY: Record<RhineQuality, RhineQualitySettings> = {
  performance: { scale: 0.8, pixelRatio: 1, shadows: 1024, ao: 0, antialias: false, transmissionScale: 0.5 },
  original: { scale: 1, pixelRatio: 2, shadows: 2048, ao: 32, antialias: true, transmissionScale: 1 },
  high: { scale: 1.25, pixelRatio: 2, shadows: 4096, ao: 32, antialias: true, transmissionScale: 1 },
};
