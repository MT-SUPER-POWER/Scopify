// store/module/player.tsx 完整替换
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// 🚨 核心优化：彻底干掉 devtools，它是导致播放高频卡顿的元凶之一
import { NeteaseLyric, SongDetail } from "@/types/api/music";
import { getLyric, greySongUrlMatch } from "@/lib/api/music";
import { toast } from "sonner";

export type RepeatMode = "off" | "all" | "one";

// 🚀 核心优化 1：建立独立的超轻量时间 Store
// 专门用来承受每秒 4 次的 <audio> 轰炸，绝对不加 persist 和 devtools
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

// 🚀 核心优化 2：主 Store 剔除时间相关的字段
type PlayerStore = {
  volume: number;
  isPlaying: boolean;
  currentSongDetail: SongDetail | null;
  currentSongUrl: string | null;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: SongDetail[];
  queueIndex: number;
  lyric: NeteaseLyric | null;

  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setQueue: (songs: SongDetail[], startIndex?: number) => void;
  setLyric: (lyric: NeteaseLyric | null) => void;

  fetchCurrentLyric: () => Promise<void>;
  playTrack: (song: SongDetail) => Promise<void>;
  playQueueIndex: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  playRandom: () => Promise<void>;
  cleanCache: () => void;
};

// 去掉了 devtools，降低运行时的性能损耗
export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      volume: 100,
      isPlaying: false,
      currentSongDetail: null,
      currentSongUrl: null,
      repeatMode: "off",
      isShuffle: false,
      queue: [],
      queueIndex: -1,
      lyric: null,

      setVolume: (v) => set({ volume: v }),
      setIsPlaying: (v) => set({ isPlaying: v }),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
      setQueue: (songs, startIndex = 0) => set({ queue: songs, queueIndex: startIndex }),
      setLyric: (lyric) => set({ lyric }),

      fetchCurrentLyric: async () => {
        const { currentSongDetail, lyric } = get();
        if (!currentSongDetail || lyric) return;
        try {
          const lyricRes = await getLyric(currentSongDetail.id);
          set({ lyric: lyricRes.data });
        } catch (e) {
          console.error("静默恢复歌词失败:", e);
        }
      },

      playTrack: async (song) => {
        // 切歌时，重置独立时间 Store
        useTimeStore.getState().setCurrentTime(0);

        set({ currentSongDetail: song, currentSongUrl: null, isPlaying: false });
        try {
          Promise.all([
            greySongUrlMatch(song.id),
            getLyric(song.id)
          ]).then(([urlRes, lyricRes]) => {
            const url = urlRes.data ?? urlRes.proxyUrl;

            // 写入新的总时长到独立 Store
            useTimeStore.getState().setTotalTime(song.dt ?? 0);

            set({ currentSongUrl: url, isPlaying: true, lyric: lyricRes.data });
          }).catch((e) => {
            toast.error("获取歌曲播放地址或歌词失败");
            set({ currentSongUrl: null, isPlaying: false, lyric: null });
          });
        } catch (e) {
          toast.error("获取歌曲播放地址失败");
        }
      },

      playQueueIndex: async (index) => {
        const { queue, playTrack } = get();
        if (index < 0 || index >= queue.length) return;
        set({ queueIndex: index });
        useTimeStore.getState().setCurrentTime(0); // 清空进度
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
        useTimeStore.getState().setCurrentTime(0);
        const prev = Math.max(0, queueIndex - 1);
        await playQueueIndex(prev);
      },

      playRandom: async () => {
        const { queue, playQueueIndex } = get();
        if (!queue.length) return;
        useTimeStore.getState().setCurrentTime(0);
        const randomIndex = Math.floor(Math.random() * queue.length);
        await playQueueIndex(randomIndex);
      },

      cleanCache: () => {
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setTotalTime(0);
        set({
          volume: 100, isPlaying: false, currentSongDetail: null, currentSongUrl: null,
          repeatMode: "off", isShuffle: false, queue: [], queueIndex: -1, lyric: null
        });
      }
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        currentSongDetail: state.currentSongDetail,
        currentSongUrl: state.currentSongUrl,
        queue: state.queue,
        queueIndex: state.queueIndex,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
      }),
    }
  )
);

// 跨窗口同步保持原样
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
