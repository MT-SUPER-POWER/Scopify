"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_BACKGROUND, DEFAULT_LYRICS_PREVIEW } from "@/constants/appearance";
import type { AppearanceStore } from "@/types/appearance";

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      background: DEFAULT_BACKGROUND,
      lyricsPreview: DEFAULT_LYRICS_PREVIEW,
      updateBackground: (patch) =>
        set((state) => ({ background: { ...state.background, ...patch } })),
      updateLyricsPreview: (patch) =>
        set((state) => ({ lyricsPreview: { ...state.lyricsPreview, ...patch } })),
      resetBackground: () => set({ background: { ...DEFAULT_BACKGROUND } }),
      resetLyricsPreview: () => set({ lyricsPreview: { ...DEFAULT_LYRICS_PREVIEW } }),
    }),
    {
      name: "scopify-appearance",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ background, lyricsPreview }) => ({ background, lyricsPreview }),
    },
  ),
);
