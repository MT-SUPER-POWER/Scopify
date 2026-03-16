// store/module/time.ts
import { create } from 'zustand';

interface TimeStore {
  currentTime: number;
  totalTime: number;
  setCurrentTime: (time: number) => void;
  setTotalTime: (time: number) => void;
}

export const useTimeStore = create<TimeStore>((set) => ({
  currentTime: 0,
  totalTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  setTotalTime: (time) => set({ totalTime: time }),
}));
