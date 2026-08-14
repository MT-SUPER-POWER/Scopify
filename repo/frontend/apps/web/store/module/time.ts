// store/module/time.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TIME_PERSISTENCE_STORAGE_KEY } from "@/constants/playbackPersistence";
import type { TimeStore } from "@/types/time";

export const useTimeStore = create<TimeStore>()(
  persist(
    (set) => ({
      currentTime: 0,
      totalTime: 0,
      bufferedTime: 0,
      setCurrentTime: (time) => set({ currentTime: time }),
      setTotalTime: (time) => set({ totalTime: time }),
      setBufferedTime: (time) => set({ bufferedTime: time }),
    }),
    {
      name: TIME_PERSISTENCE_STORAGE_KEY,
      partialize: (state) => ({
        currentTime: state.currentTime,
        totalTime: state.totalTime,
      }),
    },
  ),
);
