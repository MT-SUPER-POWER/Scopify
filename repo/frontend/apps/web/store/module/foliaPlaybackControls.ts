import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { FOLIA_CAPSULE_ACTIONS } from "@/constants/foliaCapsule";
import { useUiStore } from "@/store/module/ui";
import type {
  FoliaPlaybackControlsPreferences,
  FoliaPlaybackControlsStore,
} from "@/types/player/foliaControls";

export const useFoliaPlaybackControlsStore = create<FoliaPlaybackControlsStore>()(
  persist(
    (set) => ({
      capsuleSlots: ["repeat", "timeline"],
      visualizerPickerKeepOpen: false,
      commandWorkspaceLaunch: null,
      setCapsuleSlot: (slot, action) =>
        set((state) => {
          const capsuleSlots = [...state.capsuleSlots] as typeof state.capsuleSlots;
          const otherSlot = slot === 0 ? 1 : 0;
          if (capsuleSlots[otherSlot] === action) capsuleSlots[otherSlot] = capsuleSlots[slot];
          capsuleSlots[slot] = action;
          return { capsuleSlots };
        }),
      setVisualizerPickerKeepOpen: (visualizerPickerKeepOpen) => set({ visualizerPickerKeepOpen }),
      openCommandWorkspace: (page, frame) => {
        set({ commandWorkspaceLaunch: { page, frame } });
        useUiStore.getState().setIsSearchOpen(true);
      },
      clearCommandWorkspaceLaunch: () => set({ commandWorkspaceLaunch: null }),
    }),
    {
      name: "folia-playback-controls",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const preferences = persisted as Partial<FoliaPlaybackControlsPreferences> | undefined;
        const slots = preferences?.capsuleSlots;
        const validSlots =
          Array.isArray(slots) &&
          slots.length === 2 &&
          slots[0] !== slots[1] &&
          slots.every((slot) => FOLIA_CAPSULE_ACTIONS.includes(slot));
        return {
          ...current,
          capsuleSlots: validSlots ? slots : current.capsuleSlots,
          visualizerPickerKeepOpen:
            typeof preferences?.visualizerPickerKeepOpen === "boolean"
              ? preferences.visualizerPickerKeepOpen
              : current.visualizerPickerKeepOpen,
        };
      },
      partialize: (state) => ({
        capsuleSlots: state.capsuleSlots,
        visualizerPickerKeepOpen: state.visualizerPickerKeepOpen,
      }),
    },
  ),
);
