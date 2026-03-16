// store/module/time.ts
import { create } from 'zustand';

interface TimeStore {
  currentTime: number;
  totalTime: number;
  bufferedTime: number; // 新增缓冲时间
  setCurrentTime: (time: number) => void;
  setTotalTime: (time: number) => void;
  setBufferedTime: (time: number) => void; // 新增方法
}

export const useTimeStore = create<TimeStore>((set) => ({
  currentTime: 0,
  totalTime: 0,
  bufferedTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  setTotalTime: (time) => set({ totalTime: time }),
  setBufferedTime: (time) => set({ bufferedTime: time }),
}));
