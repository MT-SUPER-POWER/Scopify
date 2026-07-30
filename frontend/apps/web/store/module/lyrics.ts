import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_LATENT_BACKGROUND_TUNING,
  DEFAULT_MONET_BACKGROUND_TUNING,
  DEFAULT_NOMAND_BACKGROUND_TUNING,
} from "@/components/lyrics/folia/src/types";
import {
  createDefaultFoliaStageSettings,
  normalizeFoliaStageSettings,
  selectFoliaStageSettings,
} from "@/lib/lyrics/foliaStageSettings";
import {
  createBuiltinFoliaStageThemes,
  getBuiltinFoliaStageTheme,
  isBuiltinFoliaStageTheme,
  normalizeFoliaStageTheme,
} from "@/lib/lyrics/foliaTheme";
import type { FoliaStageSettings, FoliaStageStore } from "@/types/foliaStage";

const tuningDefaults = createDefaultFoliaStageSettings().tunings;

export const useLyricStageStore = create<FoliaStageStore>()(
  persist<FoliaStageStore, [], [], FoliaStageSettings>(
    (set, get) => ({
      ...createDefaultFoliaStageSettings(),
      addUrlBackground: (item) =>
        set((state) => ({
          background: {
            ...state.background,
            url: {
              ...state.background.url,
              items: [...(state.background.url?.items ?? []), item],
            },
          },
        })),
      addTheme: (theme) =>
        set((state) => {
          if (state.themes.some((item) => item.id === theme.id)) return state;
          return { themes: [...state.themes, normalizeFoliaStageTheme(theme)] };
        }),
      deleteUrlBackground: (id) =>
        set((state) => ({
          background: {
            ...state.background,
            url: {
              ...state.background.url,
              items: (state.background.url?.items ?? []).filter((item) => item.id !== id),
              selectedId:
                state.background.url?.selectedId === id ? null : state.background.url?.selectedId,
            },
          },
        })),
      deleteTheme: (id) =>
        set((state) => {
          const remainingThemes = state.themes.filter((theme) => theme.id !== id);
          const themes = remainingThemes.length ? remainingThemes : createBuiltinFoliaStageThemes();
          const themeId = state.themeId === id ? themes[0].id : state.themeId;
          return {
            themeId,
            themeRecentIds: state.themeRecentIds
              .filter((recentId) => recentId !== id && recentId !== themeId)
              .slice(0, 4),
            themes,
          };
        }),
      patchBackgroundCommon: (patch) =>
        set((state) => ({
          background: {
            ...state.background,
            common: { ...state.background.common, ...patch },
          },
        })),
      patchLatentBackground: (patch) =>
        set((state) => ({
          background: {
            ...state.background,
            latent: {
              tuning: {
                ...DEFAULT_LATENT_BACKGROUND_TUNING,
                ...state.background.latent?.tuning,
                ...patch,
              },
            },
          },
        })),
      patchMonetBackground: (patch) =>
        set((state) => ({
          background: {
            ...state.background,
            monet: {
              tuning: {
                ...DEFAULT_MONET_BACKGROUND_TUNING,
                ...state.background.monet?.tuning,
                ...patch,
              },
            },
          },
        })),
      patchNomandBackground: (patch) =>
        set((state) => ({
          background: {
            ...state.background,
            nomand: {
              tuning: {
                ...DEFAULT_NOMAND_BACKGROUND_TUNING,
                ...state.background.nomand?.tuning,
                ...patch,
              },
            },
          },
        })),
      patchSettings: (patch) => set(patch),
      patchTuning: (mode, patch) =>
        set((state) => ({
          tunings: {
            ...state.tunings,
            [mode]: { ...state.tunings[mode], ...patch },
          },
        })),
      replaceSettings: (settings) => set(normalizeFoliaStageSettings(settings)),
      resetAll: () => set(createDefaultFoliaStageSettings()),
      resetTheme: (id) =>
        set((state) => {
          const builtinTheme = getBuiltinFoliaStageTheme(id);
          if (!builtinTheme) return state;
          return {
            themes: state.themes.some((theme) => theme.id === id)
              ? state.themes.map((theme) => (theme.id === id ? builtinTheme : theme))
              : [...state.themes, builtinTheme],
          };
        }),
      resetBackgroundTuning: (mode) => {
        if (mode === "monet") get().patchMonetBackground(DEFAULT_MONET_BACKGROUND_TUNING);
        if (mode === "nomand") get().patchNomandBackground(DEFAULT_NOMAND_BACKGROUND_TUNING);
        if (mode === "latent") get().patchLatentBackground(DEFAULT_LATENT_BACKGROUND_TUNING);
      },
      resetTuning: (mode) =>
        set((state) => ({
          tunings: { ...state.tunings, [mode]: structuredClone(tuningDefaults[mode]) },
        })),
      selectUrlBackground: (selectedId) =>
        set((state) => ({
          background: {
            ...state.background,
            url: { ...state.background.url, selectedId },
          },
        })),
      setBackgroundMode: (mode) => set((state) => ({ background: { ...state.background, mode } })),
      setThemeId: (id) =>
        set((state) =>
          state.themes.some((theme) => theme.id === id)
            ? state.themeId === id
              ? state
              : {
                  themeId: id,
                  themeRecentIds: [
                    state.themeId,
                    ...state.themeRecentIds.filter(
                      (recentId) => recentId !== id && recentId !== state.themeId,
                    ),
                  ].slice(0, 4),
                }
            : state,
        ),
      setThemeVariant: (themeVariant) => set({ themeVariant }),
      restoreBuiltinThemes: () =>
        set((state) => ({
          themes: [
            ...createBuiltinFoliaStageThemes(),
            ...state.themes.filter((theme) => !isBuiltinFoliaStageTheme(theme.id)),
          ],
        })),
      updateUrlBackground: (id, patch) =>
        set((state) => ({
          background: {
            ...state.background,
            url: {
              ...state.background.url,
              items: (state.background.url?.items ?? []).map((item) =>
                item.id === id ? { ...item, ...patch } : item,
              ),
            },
          },
        })),
      updateTheme: (theme) =>
        set((state) => {
          const currentTheme = state.themes.find((item) => item.id === theme.id);
          if (!currentTheme) return state;
          const nextTheme = normalizeFoliaStageTheme(theme, currentTheme);
          return {
            themes: state.themes.map((item) => (item.id === nextTheme.id ? nextTheme : item)),
          };
        }),
    }),
    {
      name: "lyric-stage-storage",
      merge: (persisted, current) => ({
        ...current,
        ...normalizeFoliaStageSettings(persisted, selectFoliaStageSettings(current)),
      }),
      migrate: (persisted) => normalizeFoliaStageSettings(persisted),
      partialize: selectFoliaStageSettings,
      storage: createJSONStorage(() => localStorage),
      version: 4,
    },
  ),
);
