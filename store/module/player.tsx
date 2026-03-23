import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NeteaseLyric, pruneNeteaseLyric, SongDetail } from "@/types/api/music";
import { getLyric, greySongUrlMatch } from "@/lib/api/music";
import { toast } from "sonner";
import { useTimeStore } from "@/store/module/time";

export type RepeatMode = "off" | "all" | "one";


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
  playlistId: number | string | null;     // 从哪一个列表播放的，null 代表没有特定列表
  setShuffle: (v: boolean) => void;

  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setQueue: (songs: SongDetail[], startIndex?: number, playlistId?: number | string | null) => void;
  setLyric: (lyric: NeteaseLyric | null) => void;

  toggleShuffle: () => void;
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
      playlistId: null,

      setVolume: (v) => set({ volume: v }),
      setIsPlaying: (v) => set({ isPlaying: v }),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      setQueue: (songs, startIndex = 0, playlistId = null) => set({ queue: songs, queueIndex: startIndex, playlistId }),
      setLyric: (lyric) => set({ lyric: pruneNeteaseLyric(lyric) }),
      setShuffle: (v) => set({ isShuffle: v }),

      toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
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
          console.error("获取歌曲播放地址或歌词失败", e);
          set({ currentSongUrl: null, isPlaying: false, lyric: null });
        });
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
          repeatMode: "off", isShuffle: false, queue: [], queueIndex: -1, lyric: null, playlistId: null
        });
      }
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 PlayerStore 类型声明的字段，防止多余属性被存储
      partialize: (state) => ({
        volume: state.volume,
        isPlaying: state.isPlaying,
        currentSongDetail: state.currentSongDetail,
        currentSongUrl: state.currentSongUrl,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        queue: state.queue,
        queueIndex: state.queueIndex,
        lyric: state.lyric,
        playlistId: state.playlistId,
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
