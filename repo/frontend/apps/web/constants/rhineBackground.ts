import type {
  RhineBackgroundTuning,
  RhineQuality,
  RhineQualitySettings,
} from "@/types/lyrics/rhine/background";

export const DEFAULT_RHINE_BACKGROUND_TUNING: RhineBackgroundTuning = {
  colorMode: "auto",
  quality: "original",
  rhythmStyle: "legacy",
  strength: 1,
  overlayOpacity: 0.12,
  frameRate: "30",
};

/** Every style is a complete motion of its own; exactly one runs. */
export const RHINE_RHYTHM_STYLES = ["still", "breath", "legacy", "wave", "lift", "beat"] as const;
// RhineBackground's landscape lyric fade is still 64% opaque here, so anything placed further left goes unseen.
export const RHINE_READING_FADE_END = 0.42;

export const RHINE_MODEL_URL = "/folia/rhine/archive-cassette.glb";
export const RHINE_ROWS = 48;
export const RHINE_LANES = 9;
export const RHINE_LIFT = 4.05;
export const RHINE_SHOWCASE_TIMING = { rising: 0.9, holding: 1.2, returning: 1.1 } as const;
// The showcase lane rises with the archive; scaled so the lifted file stays inside the frame.
export const RHINE_RIDGE_GAIN = 0.65;
// The extracted file lights its neighbours in Rhine Music Database's amber (1, 0.72, 0.38).
// Neighbour spill, the lamp shell's own emission and a kick's flash, light theme → dark theme.
export const RHINE_GLOW = {
  color: "#ffb861",
  spill: [0.2, 4.5],
  emission: [0.06, 0.25],
  flash: [0.8, 2.2],
} as const;
export const RHINE_QUALITY: Record<RhineQuality, RhineQualitySettings> = {
  performance: {
    scale: 0.8,
    pixelRatio: 1,
    shadows: 1024,
    ao: 0,
    antialias: false,
    transmissionScale: 0.5,
  },
  original: {
    scale: 1,
    // The buffers (composer, SSAO, transmission, SMAA) all scale with the pixel count. 1.5 instead of 2 cuts them
    // to 56% on a 2x display; the background sits under a reading-space fade and the glass is frosted, so the
    // lost sharpness is hard to see. "high" keeps 2.
    pixelRatio: 1.5,
    shadows: 2048,
    ao: 32,
    antialias: true,
    transmissionScale: 1,
  },
  high: {
    scale: 1.25,
    pixelRatio: 2,
    shadows: 4096,
    ao: 32,
    antialias: true,
    transmissionScale: 1,
  },
};
