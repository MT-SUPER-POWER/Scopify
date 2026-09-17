"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BACKGROUND_PRESETS,
  DEFAULT_BACKGROUND,
  DEFAULT_LYRICS_PREVIEW,
  DEFAULT_THEME_SCHEDULE,
} from "@/constants/appearance";
import { applyBackgroundTheme, isValidThemeSchedule } from "@/lib/settings/appearance";
import type { AppearanceStore } from "@/types/appearance";

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set, get) => ({
      background: DEFAULT_BACKGROUND,
      lyricsPreview: DEFAULT_LYRICS_PREVIEW,
      themes: [],
      dailyThemeIds: BACKGROUND_PRESETS.map(({ id }) => id),
      schedule: DEFAULT_THEME_SCHEDULE,
      applyTheme: (id) =>
        set((state) => ({ background: applyBackgroundTheme(state.background, id, state.themes) })),
      saveTheme: (theme) =>
        set((state) => {
          const saved = { ...theme, name: theme.name.trim() };
          const themes = state.themes.some(({ id }) => id === theme.id)
            ? state.themes.map((item) => (item.id === theme.id ? saved : item))
            : [...state.themes, saved];
          return { themes, background: applyBackgroundTheme(state.background, theme.id, themes) };
        }),
      deleteTheme: (id) => get().deleteThemes([id]),
      deleteThemes: (ids) =>
        set((state) => {
          const removed = new Set<string>(
            state.themes.filter((theme) => ids.includes(theme.id)).map((theme) => theme.id),
          );
          const isRemoved = (id: string) => removed.has(id);
          const dailyThemeIds = state.dailyThemeIds.filter((themeId) => !isRemoved(themeId));
          return {
            themes: state.themes.filter((theme) => !removed.has(theme.id)),
            background: isRemoved(state.background.preset)
              ? { ...DEFAULT_BACKGROUND, rotation: state.background.rotation }
              : state.background,
            dailyThemeIds: dailyThemeIds.length ? dailyThemeIds : ["silver"],
            schedule: state.schedule.map((slot) =>
              isRemoved(slot.themeId) ? { ...slot, themeId: "silver" } : slot,
            ),
          };
        }),
      setDailyThemes: (ids) =>
        set((state) =>
          ids.length
            ? { dailyThemeIds: ids, background: { ...state.background, rotation: "daily" } }
            : {},
        ),
      setSchedule: (slots) =>
        set((state) =>
          isValidThemeSchedule(slots)
            ? { schedule: slots, background: { ...state.background, rotation: "schedule" } }
            : {},
        ),
      updateBackground: (patch) =>
        set((state) => ({ background: { ...state.background, ...patch } })),
      updateLyricsPreview: (patch) =>
        set((state) => ({ lyricsPreview: { ...state.lyricsPreview, ...patch } })),
      resetBackground: () => set({ background: { ...DEFAULT_BACKGROUND } }),
      resetLyricsPreview: () => set({ lyricsPreview: { ...DEFAULT_LYRICS_PREVIEW } }),
    }),
    {
      name: "scopify-appearance",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ background, lyricsPreview, themes, dailyThemeIds, schedule }) => ({
        background,
        lyricsPreview,
        themes,
        dailyThemeIds,
        schedule,
      }),
      migrate: (persisted) => {
        const previous = persisted as Partial<AppearanceStore>;
        const background = { ...DEFAULT_BACKGROUND, ...previous.background };
        const theme = {
          id: "user:migrated" as const,
          name: "Custom 01",
          top: background.customTop,
          bottom: background.customBottom,
          intensity: background.intensity,
          height: background.height,
        };
        return {
          background:
            background.preset === "custom" ? { ...background, preset: theme.id } : background,
          lyricsPreview: { ...DEFAULT_LYRICS_PREVIEW, ...previous.lyricsPreview },
          themes: [theme],
          dailyThemeIds: BACKGROUND_PRESETS.map(({ id }) => id),
          schedule: DEFAULT_THEME_SCHEDULE,
        };
      },
    },
  ),
);
