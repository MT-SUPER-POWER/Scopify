import { create, createStore } from "zustand";
import { persist } from "zustand/middleware";

import {
  STEM_MIXER_GAIN_MAX,
  STEM_MIXER_GAIN_MIN,
  STEM_MIXER_PRESETS,
  STEM_MIXER_STEMS,
} from "@/constants/stemMixer";
import type {
  Stem,
  StemMixerBlock,
  StemMixerPhase,
  StemMixerPreset,
} from "@/types/audio/stemMixer";

interface StemMixerStore {
  enabled: boolean;
  gains: readonly number[];
  phase: StemMixerPhase;
  block: StemMixerBlock | null;
  setEnabled: (enabled: boolean) => void;
  setGain: (stem: Stem, gain: number) => void;
  commitGains: () => void;
  applyPreset: (preset: StemMixerPreset) => void;
  setPhase: (phase: StemMixerPhase) => void;
  setBlock: (block: StemMixerBlock) => void;
}

const preferences = createStore<Pick<StemMixerStore, "enabled" | "gains">>()(
  persist<Pick<StemMixerStore, "enabled" | "gains">>(
    () => ({
      enabled: false,
      gains: STEM_MIXER_PRESETS.reset,
    }),
    {
      name: "scopify-stem-mixer",
      merge: (persisted, state) => {
        const saved = persisted as { enabled?: unknown; gains?: unknown } | null;
        const gains = saved?.gains;
        return {
          ...state,
          enabled: saved?.enabled === true,
          gains: STEM_MIXER_PRESETS.reset.map((value, index) => {
            const saved = Array.isArray(gains) ? gains[index] : undefined;
            return typeof saved === "number" && saved >= 0 && saved <= STEM_MIXER_GAIN_MAX
              ? saved
              : value;
          }),
        };
      },
    },
  ),
);

export const useStemMixerStore = create<StemMixerStore>((set, get) => ({
  ...preferences.getState(),
  phase: "off",
  block: null,
  setEnabled: (enabled) => {
    preferences.setState({ enabled });
    set({ enabled });
  },
  setGain: (stem, gain) =>
    set(({ gains }) => ({
      gains: gains.map((value, index) =>
        STEM_MIXER_STEMS[index] === stem && Number.isFinite(gain)
          ? Math.min(STEM_MIXER_GAIN_MAX, Math.max(STEM_MIXER_GAIN_MIN, gain))
          : value,
      ),
    })),
  commitGains: () => {
    const gains = get().gains;
    if (gains !== preferences.getState().gains) preferences.setState({ gains });
  },
  applyPreset: (preset) => {
    const gains = STEM_MIXER_PRESETS[preset];
    preferences.setState({ gains });
    set({ gains });
  },
  setPhase: (phase) => set((state) => (state.phase === phase ? state : { phase })),
  setBlock: (block) => set({ block }),
}));
