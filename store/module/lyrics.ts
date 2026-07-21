import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { LyricStageSettings, LyricVisualizerMode } from "@/types/lyrics";

interface LyricStageStore extends LyricStageSettings {
  setFontScale: (fontScale: number) => void;
  setMode: (mode: LyricVisualizerMode) => void;
  setShowRomanization: (showRomanization: boolean) => void;
  setShowTranslation: (showTranslation: boolean) => void;
}

export const useLyricStageStore = create<LyricStageStore>()(
  persist(
    (set) => ({
      fontScale: 1,
      mode: "classic",
      setFontScale: (fontScale) => set({ fontScale: Math.max(0.75, Math.min(1.35, fontScale)) }),
      setMode: (mode) => set({ mode }),
      setShowRomanization: (showRomanization) => set({ showRomanization }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      showRomanization: false,
      showTranslation: true,
    }),
    {
      name: "lyric-stage-storage",
      partialize: (state) => ({
        fontScale: state.fontScale,
        mode: state.mode,
        showRomanization: state.showRomanization,
        showTranslation: state.showTranslation,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
