"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LYRICS_PREVIEW } from "@/constants/appearance";
import { subtitlePalette } from "@/lib/settings/subtitlePalette";
import { isThemeNameValid } from "@/lib/settings/themeNames";
import type { SubtitleThemeStore } from "@/types/subtitle-preview";

export const useSubtitleThemeStore = create<SubtitleThemeStore>()(
  persist(
    (set) => ({
      themes: [],
      activeId: null,
      setActiveId: (activeId) => set({ activeId }),
      save: (theme) =>
        set((state) => {
          const name = theme.name.trim();
          if (!isThemeNameValid(theme, state.themes)) return {};
          const saved = { id: theme.id, name, settings: subtitlePalette(theme.settings) };
          return {
            themes: state.themes.some((item) => item.id === saved.id)
              ? state.themes.map((item) => (item.id === saved.id ? saved : item))
              : [...state.themes, saved],
          };
        }),
      remove: (ids) =>
        set((state) => ({
          themes: state.themes.filter((item) => !ids.includes(item.id)),
          activeId: state.activeId && ids.includes(state.activeId) ? null : state.activeId,
        })),
    }),
    {
      name: "scopify-subtitle-themes",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ themes, activeId }) => ({ themes, activeId }),
      migrate: (persisted) => {
        const previous = persisted as Partial<SubtitleThemeStore>;
        return {
          activeId: previous.activeId ?? null,
          themes: (previous.themes ?? []).map((theme) => ({
            id: theme.id,
            name: theme.name,
            settings: subtitlePalette({ ...DEFAULT_LYRICS_PREVIEW, ...theme.settings }),
          })),
        };
      },
    },
  ),
);
