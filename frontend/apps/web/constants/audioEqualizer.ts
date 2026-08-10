import type { AudioEqualizerPresetId, AudioEqualizerSettings } from "@/types/audioEqualizer";

export const AUDIO_EQUALIZER_MIN_GAIN_DB = -12;
export const AUDIO_EQUALIZER_MAX_GAIN_DB = 12;

export const AUDIO_EQUALIZER_BANDS = [
  { frequency: 31, label: "31" },
  { frequency: 62, label: "62" },
  { frequency: 125, label: "125" },
  { frequency: 250, label: "250" },
  { frequency: 500, label: "500" },
  { frequency: 1000, label: "1k" },
  { frequency: 2000, label: "2k" },
  { frequency: 4000, label: "4k" },
  { frequency: 8000, label: "8k" },
  { frequency: 16000, label: "16k" },
] as const;

export const AUDIO_EQUALIZER_PRESETS: Record<AudioEqualizerPresetId, readonly number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  lofi: [-4, -2, 0, 2, 3, 2, 0, -3, -7, -10],
  radio: [-12, -8, -3, 2, 4, 4, 2, -3, -8, -12],
  vinyl: [3, 2, 1, 0, -1, -1, -2, -3, -5, -7],
  vocal: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
  bass: [6, 5, 3, 1, 0, -1, -1, 0, 1, 2],
};

export const DEFAULT_AUDIO_EQUALIZER_SETTINGS: AudioEqualizerSettings = {
  enabled: false,
  gains: [...AUDIO_EQUALIZER_PRESETS.flat],
  preset: "flat",
  customGains: [...AUDIO_EQUALIZER_PRESETS.flat],
};
