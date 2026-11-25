import type { Stem, StemMixerPreset } from "@/types/audio/stemMixer";

export const STEM_MIXER_STEMS = [
  "drums",
  "bass",
  "other",
  "vocals",
] as const satisfies readonly Stem[];
export const STEM_MIXER_PRESETS = {
  reset: [1, 1, 1, 1],
  karaoke: [1, 1, 1, 0],
  vocals: [0, 0, 0, 1],
} as const satisfies Record<StemMixerPreset, readonly number[]>;

export const STEM_MIXER_GAIN_MAX = 2;
export const STEM_MIXER_GAIN_MIN = 0;
export const STEM_MIXER_RATE = 44100;
export const STEM_MIXER_ASSET_PATH = "/stem-mixer/v1";
