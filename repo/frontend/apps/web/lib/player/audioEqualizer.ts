import {
  AUDIO_EQUALIZER_BANDS,
  AUDIO_EQUALIZER_MAX_GAIN_DB,
  AUDIO_EQUALIZER_MIN_GAIN_DB,
  AUDIO_EQUALIZER_PRESETS,
  AUDIO_EFFECT_CONTROLS,
  DEFAULT_AUDIO_EQUALIZER_SETTINGS,
} from "@/constants/audioEqualizer";
import type {
  AudioEffectSettings,
  AudioEqualizerModeId,
  AudioEqualizerCustomSlotId,
  AudioEqualizerUserPreset,
  AudioEqualizerUserPresetId,
  AudioEqualizerPresetId,
  AudioEqualizerSettings,
} from "@/types/audioEqualizer";

const normalizeEffects = (value: unknown): AudioEffectSettings => {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return Object.fromEntries(
    AUDIO_EFFECT_CONTROLS.map((control) => {
      const parsed = Number(candidate[control.id]);
      const value = Number.isFinite(parsed) ? parsed : control.neutral;
      return [control.id, Math.min(control.max, Math.max(control.min, value))];
    }),
  ) as AudioEffectSettings;
};

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

const CUSTOM_SLOT_IDS: AudioEqualizerCustomSlotId[] = ["custom-1", "custom-2", "custom-3"];
const isCustomSlotId = (value: unknown): value is AudioEqualizerCustomSlotId =>
  typeof value === "string" && CUSTOM_SLOT_IDS.includes(value as AudioEqualizerCustomSlotId);

const isUserPresetId = (value: unknown): value is AudioEqualizerUserPresetId =>
  typeof value === "string" && value.startsWith("user:") && value.length > 5;

const normalizeCustomPresets = (value: unknown): AudioEqualizerUserPreset[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<AudioEqualizerUserPreset>;
    const id = isUserPresetId(candidate.id) ? candidate.id : (`user:migrated-${index}` as const);
    const now = Date.now();
    return [
      {
        createdAt: Number.isFinite(candidate.createdAt) ? Number(candidate.createdAt) : now,
        effects: normalizeEffects(candidate.effects),
        gains: normalizeGains(candidate.gains),
        id,
        name:
          typeof candidate.name === "string" && candidate.name.trim()
            ? candidate.name.trim().slice(0, 40)
            : `Custom ${index + 1}`,
        updatedAt: Number.isFinite(candidate.updatedAt) ? Number(candidate.updatedAt) : now,
      },
    ];
  });
};

const resolveModeId = (value: unknown, gains: number[]): AudioEqualizerModeId => {
  if (isCustomSlotId(value)) return value;
  if (value === "custom") return "custom-1";
  if (isPresetId(value)) return value;
  return (
    (Object.entries(AUDIO_EQUALIZER_PRESETS) as [AudioEqualizerPresetId, readonly number[]][]).find(
      ([, preset]) => preset.every((gain, index) => gain === gains[index]),
    )?.[0] ?? "custom-1"
  );
};

export function resolveAudioEqualizerSettings(value: unknown): AudioEqualizerSettings {
  if (!value || typeof value !== "object") {
    return {
      ...DEFAULT_AUDIO_EQUALIZER_SETTINGS,
      gains: [...DEFAULT_AUDIO_EQUALIZER_SETTINGS.gains],
      customGains: [...DEFAULT_AUDIO_EQUALIZER_SETTINGS.customGains],
      customSlots: DEFAULT_AUDIO_EQUALIZER_SETTINGS.customSlots.map((slot) => ({
        effects: { ...slot.effects },
        gains: [...slot.gains],
      })),
      customPresets: [],
      effects: { ...DEFAULT_AUDIO_EQUALIZER_SETTINGS.effects },
    };
  }

  const candidate = value as Partial<AudioEqualizerSettings>;
  const persistedSlots = Array.isArray(candidate.customSlots) ? candidate.customSlots : [];
  const storedCustomPresets = normalizeCustomPresets(candidate.customPresets);
  const customPresets = Array.isArray(candidate.customPresets)
    ? storedCustomPresets
    : persistedSlots.map((slot, index) => ({
        createdAt: Date.now(),
        effects: normalizeEffects((slot as { effects?: unknown }).effects),
        gains: normalizeGains((slot as { gains?: unknown }).gains),
        id: `user:migrated-${index}` as AudioEqualizerUserPresetId,
        name: `Custom ${index + 1}`,
        updatedAt: Date.now(),
      }));
  const gains = normalizeGains(candidate.gains);
  const legacySlotIndex = CUSTOM_SLOT_IDS.indexOf(candidate.preset as AudioEqualizerCustomSlotId);
  const preset =
    isUserPresetId(candidate.preset) && customPresets.some((item) => item.id === candidate.preset)
      ? candidate.preset
      : legacySlotIndex >= 0 && customPresets[legacySlotIndex]
        ? customPresets[legacySlotIndex].id
        : resolveModeId(candidate.preset, gains);
  const legacyCustomGains = Array.isArray(candidate.customGains)
    ? normalizeGains(candidate.customGains)
    : gains;
  return {
    customPresets,
    customSlots: DEFAULT_AUDIO_EQUALIZER_SETTINGS.customSlots.map((fallback, index) => {
      const slot = persistedSlots[index];
      if (!slot || typeof slot !== "object") {
        return index === 0
          ? { gains: [...legacyCustomGains], effects: normalizeEffects(candidate.effects) }
          : { gains: [...fallback.gains], effects: { ...fallback.effects } };
      }
      return {
        gains: normalizeGains((slot as { gains?: unknown }).gains),
        effects: normalizeEffects((slot as { effects?: unknown }).effects),
      };
    }),
    enabled: candidate.enabled === true,
    effects: normalizeEffects(candidate.effects),
    gains,
    preset,
    customGains: Array.isArray(candidate.customGains)
      ? normalizeGains(candidate.customGains)
      : [...(isCustomSlotId(preset) ? gains : DEFAULT_AUDIO_EQUALIZER_SETTINGS.customGains)],
  };
}
