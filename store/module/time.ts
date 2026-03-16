// store/module/time.ts
import { create } from 'zustand';

interface TimeStore {
  currentTime: number;
  setCurrentTime: (time: number) => void;
}

export const useTimeStore = create<TimeStore>((set) => ({
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
}));
