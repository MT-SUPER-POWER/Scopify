import {
  DEFAULT_LYRIC_RENDER_OVERRIDE,
  normalizeLyricRenderOverride,
} from "@/components/lyrics/folia/src/utils/lyricRenderQuality";
import type {
  MetaphorBooleanKey,
  MetaphorNumberKey,
  MetaphorTuning,
} from "@/types/lyrics/folia/metaphor";

export const METAPHOR_LIMITS: Record<MetaphorNumberKey, { min: number; max: number }> = {
  cutPace: { min: 0.4, max: 2 },
  cameraMotion: { min: 0, max: 2 },
  flow: { min: 0, max: 2 },
  blobs: { min: 0, max: 2 },
  halftone: { min: 0.5, max: 2.5 },
  grain: { min: 0, max: 2 },
};

const METAPHOR_BOOLEAN_KEYS: readonly MetaphorBooleanKey[] = [
  "negative",
  "flip",
  "keywordColors",
  "transitions",
];

export const DEFAULT_METAPHOR_TUNING: MetaphorTuning = {
  render: DEFAULT_LYRIC_RENDER_OVERRIDE,
  cutPace: 1,
  cameraMotion: 1,
  flow: 1,
  blobs: 1,
  halftone: 1,
  grain: 1,
  negative: true,
  flip: false,
  keywordColors: false,
  transitions: true,
};

export const normalizeMetaphorTuning = (stored: unknown): MetaphorTuning => {
  const values =
    stored && typeof stored === "object"
      ? (stored as Partial<Record<keyof MetaphorTuning, unknown>>)
      : {};
  const tuning = {
    ...DEFAULT_METAPHOR_TUNING,
    render: normalizeLyricRenderOverride(values.render),
  };
  for (const key of Object.keys(METAPHOR_LIMITS) as MetaphorNumberKey[]) {
    const value = values[key];
    const { min, max } = METAPHOR_LIMITS[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      tuning[key] = Math.min(max, Math.max(min, value));
    }
  }
  for (const key of METAPHOR_BOOLEAN_KEYS) {
    const value = values[key];
    if (typeof value === "boolean") tuning[key] = value;
  }
  return tuning;
};
