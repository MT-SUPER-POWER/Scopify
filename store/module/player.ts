import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";        // NOTE: SSR 没有 localstorage，所以得小心这个问题

type PlayerStore = {
  volume: number;
  currentSong: string | null;
  currentTime: number;
  totalTime: number;

  setVolume: (v: number) => void;
  setSong: (id: string) => void;
  setCurrentTime: (time: number) => void;
  setTotalTime: (time: number) => void;
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      volume: 100,
      currentSong: null,
      currentTime: 0,
      totalTime: 0,

      setVolume: (v) => set({ volume: v }),
      setSong: (id) => set({ currentSong: id }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setTotalTime: (time) => set({ totalTime: time }),
    }),
    {
      name: 'player-storage', // 存储在 localStorage 中的 key
      // 这里的 storage 默认就是 localStorage，如果是 React Native 则需要换成 AsyncStorage
      storage: createJSONStorage(() => localStorage),
      // 可选：如果你只想持久化部分字段（比如只存音量，不存进度）
      partialize: (state) => ({ volume: state.volume, currentSong: state.currentSong }),
    }
  )
);

// NOTE: 监听跨窗口/标签页的 localStorage 变化并同步状态 (实现主窗口和小组件窗口等实时同步)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "player-storage" && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        if (newState && newState.state) {
          usePlayerStore.setState(newState.state);
        }
      } catch (error) {
        console.error("同步跨窗口 Zustand 状态失败", error);
      }
    }
  });
}
