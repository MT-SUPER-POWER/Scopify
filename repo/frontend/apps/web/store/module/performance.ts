import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_PLAYBACK_PROGRESS_REFRESH_RATE,
  PERFORMANCE_STORAGE_KEY,
  PLAYBACK_PROGRESS_REFRESH_RATES,
} from "@/constants/performance";
import type { PerformanceStore, PlaybackProgressRefreshRate } from "@/types/performance";

function isProgressRefreshRate(value: unknown): value is PlaybackProgressRefreshRate {
  return PLAYBACK_PROGRESS_REFRESH_RATES.some((rate) => rate === value);
}

export const usePerformanceStore = create<PerformanceStore>()(
  persist(
    (set) => ({
      progressRefreshRate: DEFAULT_PLAYBACK_PROGRESS_REFRESH_RATE,
      setProgressRefreshRate: (rate) => set({ progressRefreshRate: rate }),
    }),
    {
      name: PERFORMANCE_STORAGE_KEY,
      partialize: (state) => ({ progressRefreshRate: state.progressRefreshRate }),
      merge: (persisted, current) => {
        const rate = (persisted as Partial<PerformanceStore> | undefined)?.progressRefreshRate;
        return isProgressRefreshRate(rate) ? { ...current, progressRefreshRate: rate } : current;
      },
    },
  ),
);

// Companion windows (Dynamic Island, taskbar and desktop lyrics) share this origin's storage.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === PERFORMANCE_STORAGE_KEY) {
      void usePerformanceStore.persist.rehydrate();
    }
  });
}
