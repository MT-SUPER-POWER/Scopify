import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AUDIO_EQUALIZER_PRESETS,
  DEFAULT_AUDIO_EQUALIZER_SETTINGS,
} from "@/constants/audioEqualizer";
import { resolveAudioEqualizerSettings } from "@/lib/player/audioEqualizer";
import type { AudioEqualizerModeId, AudioEqualizerStore } from "@/types/audioEqualizer";

const resolvePresetGains = (preset: AudioEqualizerModeId, customGains: number[]) =>
  preset === "custom" ? [...customGains] : [...AUDIO_EQUALIZER_PRESETS[preset]];

export const useAudioEqualizerStore = create<AudioEqualizerStore>()(
  persist(
    (set) => ({
      dialogTab: "quality",
      isDialogOpen: false,
      settings: resolveAudioEqualizerSettings(DEFAULT_AUDIO_EQUALIZER_SETTINGS),
      applyPreset: (preset) =>
        set((state) => ({
          settings: {
            ...state.settings,
            enabled: true,
            gains: resolvePresetGains(preset, state.settings.customGains),
            preset,
          },
        })),
      closeDialog: () => set({ isDialogOpen: false }),
      openDialog: (dialogTab = "quality") => set({ dialogTab, isDialogOpen: true }),
      setBandGain: (index, gain) =>
        set((state) => {
          if (index < 0 || index >= state.settings.gains.length) return state;
          const gains = [...state.settings.gains];
          gains[index] = gain;
          const settings = resolveAudioEqualizerSettings({
            ...state.settings,
            enabled: true,
            gains,
            preset: "custom",
            customGains: gains,
          });
          return { settings };
        }),
      setDialogTab: (dialogTab) => set({ dialogTab }),
      setEnabled: (enabled) => set((state) => ({ settings: { ...state.settings, enabled } })),
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
