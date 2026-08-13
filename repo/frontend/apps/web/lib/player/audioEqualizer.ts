import {
  AUDIO_EQUALIZER_BANDS,
  AUDIO_EQUALIZER_MAX_GAIN_DB,
  AUDIO_EQUALIZER_MIN_GAIN_DB,
  AUDIO_EQUALIZER_PRESETS,
  DEFAULT_AUDIO_EQUALIZER_SETTINGS,
} from "@/constants/audioEqualizer";
import type {
  AudioEqualizerModeId,
  AudioEqualizerPresetId,
  AudioEqualizerSettings,
} from "@/types/audioEqualizer";

const clampGain = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(AUDIO_EQUALIZER_MAX_GAIN_DB, Math.max(AUDIO_EQUALIZER_MIN_GAIN_DB, parsed));
};

const normalizeGains = (value: unknown) => {
  const gains = Array.isArray(value) ? value : [];
  return AUDIO_EQUALIZER_BANDS.map((_, index) => clampGain(gains[index]));
};

const isPresetId = (value: unknown): value is AudioEqualizerPresetId =>
  typeof value === "string" && Object.hasOwn(AUDIO_EQUALIZER_PRESETS, value);

const resolveModeId = (value: unknown, gains: number[]): AudioEqualizerModeId => {
  if (value === "custom" || isPresetId(value)) return value;
  return (
    (Object.entries(AUDIO_EQUALIZER_PRESETS) as [AudioEqualizerPresetId, readonly number[]][]).find(
      ([, preset]) => preset.every((gain, index) => gain === gains[index]),
    )?.[0] ?? "custom"
  );
};

export function resolveAudioEqualizerSettings(value: unknown): AudioEqualizerSettings {
  if (!value || typeof value !== "object") {
    return {
      ...DEFAULT_AUDIO_EQUALIZER_SETTINGS,
      gains: [...DEFAULT_AUDIO_EQUALIZER_SETTINGS.gains],
      customGains: [...DEFAULT_AUDIO_EQUALIZER_SETTINGS.customGains],
    };
  }

  const candidate = value as Partial<AudioEqualizerSettings>;
  const gains = normalizeGains(candidate.gains);
  const preset = resolveModeId(candidate.preset, gains);
  return {
    enabled: candidate.enabled === true,
    gains,
    preset,
    customGains: Array.isArray(candidate.customGains)
      ? normalizeGains(candidate.customGains)
      : [...(preset === "custom" ? gains : DEFAULT_AUDIO_EQUALIZER_SETTINGS.customGains)],
  };
}
