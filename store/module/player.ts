import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand-devtools";
import { SongDetail } from "@/types/api/music";
import { greySongUrlMatch } from "@/lib/api/music";

export type RepeatMode = "off" | "all" | "one";

type PlayerStore = {
  volume: number;
  isPlaying: boolean;
  currentSongDetail: SongDetail | null;
  currentSongUrl: string | null;
  currentTime: number;
  totalTime: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: SongDetail[];       // 当前播放队列
  queueIndex: number;        // 当前队列位置

  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (time: number) => void;
  setTotalTime: (time: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setQueue: (songs: SongDetail[], startIndex?: number) => void;

  // 核心：播放指定歌曲（自动拉取 url）
  playTrack: (song: SongDetail) => Promise<void>;
  // 从队列里播放指定 index
  playQueueIndex: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
};


// TODO: 退出登录或者用户一退出之后的清理
export const usePlayerStore = create<PlayerStore>()(
  devtools(
    persist(
      (set, get) => ({
        volume: 100,
        isPlaying: false,
        currentSongDetail: null,
        currentSongUrl: null,
        currentTime: 0,
        totalTime: 0,
        repeatMode: "off",
        isShuffle: false,
        queue: [],
        queueIndex: -1,

        setVolume: (v) => set({ volume: v }),
        setIsPlaying: (v) => set({ isPlaying: v }),
        setCurrentTime: (time) => set({ currentTime: time }),
        setTotalTime: (time) => set({ totalTime: time }),
        setRepeatMode: (mode) => set({ repeatMode: mode }),
        toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
        setQueue: (songs, startIndex = 0) => set({ queue: songs, queueIndex: startIndex }),

        playTrack: async (song) => {
          set({ currentSongDetail: song, currentSongUrl: null, isPlaying: false, currentTime: 0 });
          try {
            const res = await greySongUrlMatch(song.id);
            const url = res.data ?? res.proxyUrl;
            set({ currentSongUrl: url, isPlaying: true, totalTime: song.dt });
          } catch (e) {
            console.error("获取歌曲播放地址失败:", e);
          }
        },

        playQueueIndex: async (index) => {
          const { queue, playTrack } = get();
          if (index < 0 || index >= queue.length) return;
          set({ queueIndex: index });
          await playTrack(queue[index]);
        },

        playNext: async () => {
          const { queue, queueIndex, repeatMode, isShuffle, playQueueIndex } = get();
          if (!queue.length) return;
          let next: number;
          if (isShuffle) {
            next = Math.floor(Math.random() * queue.length);
          } else if (repeatMode === "one") {
            next = queueIndex;
          } else {
            next = queueIndex + 1;
            if (next >= queue.length) next = repeatMode === "all" ? 0 : -1;
          }
          if (next >= 0) await playQueueIndex(next);
          else set({ isPlaying: false });
        },

        playPrev: async () => {
          const { queueIndex, playQueueIndex } = get();
          const prev = Math.max(0, queueIndex - 1);
          await playQueueIndex(prev);
        },

        cleanCache: () => {
          set({
            volume: 100,
            isPlaying: false,
            currentSongDetail: null,
            currentSongUrl: null,
            currentTime: 0,
            totalTime: 0,
            repeatMode: "off",
            isShuffle: false,
            queue: [],
            queueIndex: -1,
          })
        }
      }),
      {
        name: 'player-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ volume: state.volume, currentSongDetail: state.currentSongDetail }),
      }
    )
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
