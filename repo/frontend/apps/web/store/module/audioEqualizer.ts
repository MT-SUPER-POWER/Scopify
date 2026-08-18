import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AUDIO_EQUALIZER_PRESETS,
  AUDIO_EFFECT_PRESETS,
  DEFAULT_AUDIO_EQUALIZER_SETTINGS,
} from "@/constants/audioEqualizer";
import { resolveAudioEqualizerSettings } from "@/lib/player/audioEqualizer";
import type {
  AudioEqualizerCustomSlotId,
  AudioEqualizerModeId,
  AudioEqualizerStore,
  AudioEqualizerUserPresetId,
} from "@/types/audioEqualizer";

const CUSTOM_SLOT_IDS: AudioEqualizerCustomSlotId[] = ["custom-1", "custom-2", "custom-3"];
const customSlotIndex = (preset: AudioEqualizerModeId) =>
  CUSTOM_SLOT_IDS.indexOf(preset as AudioEqualizerCustomSlotId);
const isUserPresetId = (preset: AudioEqualizerModeId): preset is AudioEqualizerUserPresetId =>
  preset.startsWith("user:");
const createUserPresetId = () =>
  `user:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}` as AudioEqualizerUserPresetId;

const resolvePresetGains = (preset: AudioEqualizerModeId, customGains: number[]) =>
  customSlotIndex(preset) >= 0
    ? [...customGains]
    : [...AUDIO_EQUALIZER_PRESETS[preset as keyof typeof AUDIO_EQUALIZER_PRESETS]];

export const useAudioEqualizerStore = create<AudioEqualizerStore>()(
  persist(
    (set) => ({
      dialogTab: "quality",
      isDialogOpen: false,
      settings: resolveAudioEqualizerSettings(DEFAULT_AUDIO_EQUALIZER_SETTINGS),
      applyPreset: (preset) =>
        set((state) => {
          if (isUserPresetId(preset)) {
            const customPreset = state.settings.customPresets.find((item) => item.id === preset);
            if (!customPreset) return state;
            return {
              settings: resolveAudioEqualizerSettings({
                ...state.settings,
                effects: { ...customPreset.effects },
                enabled: true,
                gains: [...customPreset.gains],
                preset,
              }),
            };
          }
          const slotIndex = customSlotIndex(preset);
          const slot = slotIndex >= 0 ? state.settings.customSlots[slotIndex] : null;
          return {
            settings: {
              ...state.settings,
              enabled: true,
              effects: slot
                ? { ...slot.effects }
                : { ...AUDIO_EFFECT_PRESETS[preset as keyof typeof AUDIO_EFFECT_PRESETS] },
              gains: slot
                ? [...slot.gains]
                : resolvePresetGains(preset, state.settings.customGains),
              preset,
            },
          };
        }),
      commitSettings: (settings) =>
        set(() => {
          const now = Date.now();
          const next = isUserPresetId(settings.preset)
            ? {
                ...settings,
                customPresets: settings.customPresets.map((preset) =>
                  preset.id === settings.preset
                    ? {
                        ...preset,
                        effects: { ...settings.effects },
                        gains: [...settings.gains],
                        updatedAt: now,
                      }
                    : preset,
                ),
              }
            : settings;
          return { settings: resolveAudioEqualizerSettings(next) };
        }),
      createCustomPreset: (name) => {
        const id = createUserPresetId();
        set((state) => {
          const now = Date.now();
          const nextName = name?.trim() || `Custom ${state.settings.customPresets.length + 1}`;
          return {
            settings: resolveAudioEqualizerSettings({
              ...state.settings,
              customPresets: [
                ...state.settings.customPresets,
                {
                  createdAt: now,
                  effects: { ...state.settings.effects },
                  gains: [...state.settings.gains],
                  id,
                  name: nextName,
                  updatedAt: now,
                },
              ],
              enabled: true,
              preset: id,
            }),
          };
        });
        return id;
      },
      deleteCustomPreset: (id) =>
        set((state) => ({
          settings: resolveAudioEqualizerSettings({
            ...state.settings,
            ...(state.settings.preset === id
              ? {
                  effects: { ...AUDIO_EFFECT_PRESETS.flat },
                  gains: [...AUDIO_EQUALIZER_PRESETS.flat],
                  preset: "flat",
                }
              : {}),
            customPresets: state.settings.customPresets.filter((preset) => preset.id !== id),
          }),
        })),
      duplicateCustomPreset: (id) => {
        let duplicateId: AudioEqualizerUserPresetId | null = null;
        set((state) => {
          const source = state.settings.customPresets.find((preset) => preset.id === id);
          if (!source) return state;
          const nextId = createUserPresetId();
          duplicateId = nextId;
          const now = Date.now();
          return {
            settings: resolveAudioEqualizerSettings({
              ...state.settings,
              customPresets: [
                ...state.settings.customPresets,
                {
                  ...source,
                  createdAt: now,
                  effects: { ...source.effects },
                  gains: [...source.gains],
                  id: nextId,
                  name: `${source.name} Copy`,
                  updatedAt: now,
                },
              ],
              effects: { ...source.effects },
              gains: [...source.gains],
              preset: nextId,
            }),
          };
        });
        return duplicateId;
      },
      renameCustomPreset: (id, name) =>
        set((state) => {
          const trimmed = name.trim().slice(0, 40);
          if (!trimmed) return state;
          return {
            settings: resolveAudioEqualizerSettings({
              ...state.settings,
              customPresets: state.settings.customPresets.map((preset) =>
                preset.id === id ? { ...preset, name: trimmed, updatedAt: Date.now() } : preset,
              ),
            }),
          };
        }),
      closeDialog: () => set({ isDialogOpen: false }),
      openDialog: (dialogTab = "quality") => set({ dialogTab, isDialogOpen: true }),
      setBandGain: (index, gain) =>
        set((state) => {
          if (index < 0 || index >= state.settings.gains.length) return state;
          const gains = [...state.settings.gains];
          gains[index] = gain;
          const slotIndex = Math.max(0, customSlotIndex(state.settings.preset));
          const customSlots = state.settings.customSlots.map((slot, cursor) =>
            cursor === slotIndex
              ? { gains: [...gains], effects: { ...state.settings.effects } }
              : slot,
          );
          const settings = resolveAudioEqualizerSettings({
            ...state.settings,
            customSlots,
            enabled: true,
            gains,
            preset: CUSTOM_SLOT_IDS[slotIndex],
            customGains: gains,
          });
          return { settings };
        }),
      setDialogTab: (dialogTab) => set({ dialogTab }),
      setEnabled: (enabled) => set((state) => ({ settings: { ...state.settings, enabled } })),
      setEffect: (id, value) =>
        set((state) => {
          const slotIndex = Math.max(0, customSlotIndex(state.settings.preset));
          const effects = { ...state.settings.effects, [id]: value };
          return {
            settings: resolveAudioEqualizerSettings({
              ...state.settings,
              customSlots: state.settings.customSlots.map((slot, cursor) =>
                cursor === slotIndex ? { gains: [...state.settings.gains], effects } : slot,
              ),
              effects,
              enabled: true,
              preset: CUSTOM_SLOT_IDS[slotIndex],
            }),
          };
        }),
      resetCustomSlot: (slot) =>
        set((state) => {
          const index = customSlotIndex(slot);
          if (index < 0) return state;
          const reset = {
            gains: [...AUDIO_EQUALIZER_PRESETS.flat],
            effects: { ...AUDIO_EFFECT_PRESETS.flat },
          };
          return {
            settings: resolveAudioEqualizerSettings({
              ...state.settings,
              ...(state.settings.preset === slot ? reset : {}),
              customSlots: state.settings.customSlots.map((current, cursor) =>
                cursor === index ? reset : current,
              ),
            }),
          };
        }),
    }),
    {
      name: "audio-equalizer-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
      merge: (persisted, current) => ({
        ...current,
        settings: resolveAudioEqualizerSettings(
          (persisted as Partial<AudioEqualizerStore> | undefined)?.settings,
        ),
      }),
    },
  ),
);
