"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isThemeNameValid } from "@/lib/settings/themeNames";
import type { SubtitleThemeStore } from "@/types/subtitle-preview";

export const useSubtitleThemeStore = create<SubtitleThemeStore>()(
  persist(
    (set) => ({
      themes: [],
      save: (theme) =>
        set((state) => {
          const name = theme.name.trim();
          if (!isThemeNameValid(theme, state.themes)) return {};
          const saved = { ...theme, name, settings: { ...theme.settings } };
          return {
            themes: state.themes.some((item) => item.id === saved.id)
              ? state.themes.map((item) => (item.id === saved.id ? saved : item))
              : [...state.themes, saved],
          };
        }),
      remove: (ids) =>
        set((state) => ({ themes: state.themes.filter((item) => !ids.includes(item.id)) })),
    }),
    {
      name: "scopify-subtitle-themes",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ themes }) => ({ themes }),
    },
  ),
);
