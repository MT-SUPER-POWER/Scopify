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
      version: 1,
    },
  ),
);
