// store/module/time.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimeStore {
  currentTime: number;
  totalTime: number;
  bufferedTime: number;
  setCurrentTime: (time: number) => void;
  setTotalTime: (time: number) => void;
  setBufferedTime: (time: number) => void;
}

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
      name: "player-time-storage",
      partialize: (state) => ({
        currentTime: state.currentTime,
        totalTime: state.totalTime,
      }),
    },
  ),
);
