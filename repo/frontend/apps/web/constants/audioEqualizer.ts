import type {
  AudioEffectControl,
  AudioEffectId,
  AudioEffectSettings,
  AudioEqualizerPresetId,
  AudioEqualizerSettings,
} from "@/types/audioEqualizer";

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

export const AUDIO_EFFECT_CONTROLS: readonly AudioEffectControl[] = [
  { id: "highpass", min: 20, max: 2000, step: 1, neutral: 20, scale: "log", unit: "hz" },
  { id: "lowpass", min: 500, max: 20000, step: 1, neutral: 20000, scale: "log", unit: "hz" },
  { id: "drive", min: 0, max: 1, step: 0.01, neutral: 0, scale: "linear", unit: "ratio" },
  { id: "crush", min: 0, max: 1, step: 0.01, neutral: 0, scale: "linear", unit: "ratio" },
  { id: "wow", min: 0, max: 1, step: 0.01, neutral: 0, scale: "linear", unit: "ratio" },
  { id: "noise", min: 0, max: 1, step: 0.01, neutral: 0, scale: "linear", unit: "ratio" },
  { id: "width", min: 0, max: 2, step: 0.01, neutral: 1, scale: "linear", unit: "ratio" },
  { id: "space", min: 0, max: 1, step: 0.01, neutral: 0, scale: "linear", unit: "ratio" },
  { id: "punch", min: 0, max: 1, step: 0.01, neutral: 0, scale: "linear", unit: "ratio" },
];

export const AUDIO_EFFECT_CONTROL_MAP = Object.fromEntries(
  AUDIO_EFFECT_CONTROLS.map((control) => [control.id, control]),
) as Record<AudioEffectId, AudioEffectControl>;

export const DEFAULT_AUDIO_EFFECT_SETTINGS = Object.fromEntries(
  AUDIO_EFFECT_CONTROLS.map((control) => [control.id, control.neutral]),
) as AudioEffectSettings;

export const AUDIO_EFFECT_PRESETS: Record<AudioEqualizerPresetId, AudioEffectSettings> = {
  flat: { ...DEFAULT_AUDIO_EFFECT_SETTINGS },
  lofi: {
    ...DEFAULT_AUDIO_EFFECT_SETTINGS,
    highpass: 90,
    lowpass: 6000,
    drive: 0.05,
    crush: 0.45,
    wow: 0.32,
    noise: 0.22,
    width: 0.7,
    space: 0.16,
    punch: 0.4,
  },
  radio: {
    ...DEFAULT_AUDIO_EFFECT_SETTINGS,
    highpass: 420,
    lowpass: 3800,
    drive: 0.42,
    crush: 0.3,
    wow: 0.1,
    noise: 0.2,
    width: 0.12,
    punch: 0.6,
  },
  vinyl: {
    ...DEFAULT_AUDIO_EFFECT_SETTINGS,
    highpass: 55,
    lowpass: 12000,
    drive: 0.16,
    wow: 0.42,
    noise: 0.34,
    width: 0.86,
    space: 0.1,
    punch: 0.22,
  },
  vocal: { ...DEFAULT_AUDIO_EFFECT_SETTINGS, highpass: 110, width: 0.9, space: 0.08, punch: 0.35 },
  bass: { ...DEFAULT_AUDIO_EFFECT_SETTINGS, lowpass: 16000, drive: 0.08, width: 1.08, punch: 0.72 },
};

export const DEFAULT_AUDIO_EQUALIZER_SETTINGS: AudioEqualizerSettings = {
  customPresets: [],
  customSlots: Array.from({ length: 3 }, () => ({
    effects: { ...DEFAULT_AUDIO_EFFECT_SETTINGS },
    gains: [...AUDIO_EQUALIZER_PRESETS.flat],
  })),
  enabled: false,
  effects: { ...DEFAULT_AUDIO_EFFECT_SETTINGS },
  gains: [...AUDIO_EQUALIZER_PRESETS.flat],
  preset: "flat",
  customGains: [...AUDIO_EQUALIZER_PRESETS.flat],
};
