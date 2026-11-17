import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CinemaSceneState } from "@/types/lyrics/cinema";

export const useCinemaSceneStore = create<CinemaSceneState>()(
  persist(
    (set) => ({
      enabled: false,
      seatId: null,
      houseLights: false,
      curtainsOnPause: true,
      quality: "medium",
      cameraRevision: 0,
      recenter: () => set((state) => ({ cameraRevision: state.cameraRevision + 1 })),
      updatePreferences: set,
    }),
    {
      name: "scopify-cinema-scene",
      partialize: ({ enabled, seatId, houseLights, curtainsOnPause, quality }) => ({
        enabled,
        seatId,
        houseLights,
        curtainsOnPause,
        quality,
      }),
    },
  ),
);
