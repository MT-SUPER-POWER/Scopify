"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { devtools } from "zustand-devtools";
import { NeteaseLyric, SongDetail } from "@/types/api/music";
import { getLyric, greySongUrlMatch } from "@/lib/api/music";
import { toast } from "sonner";
import { useTimeStore } from "./time";

export type RepeatMode = "off" | "all" | "one";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🚀 核心优化 1：自定义异步 Storage，将耗时的硬盘同步推迟到主线程绘制（Paint）之后
const asyncDebouncedStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    // 使用 setTimeout 宏任务，彻底解决点击下一首/播放时，localStorage 阻塞造成的严重 INP 问题
    // 这让浏览器的 UI 反馈可以瞬间完成，而后在后台悄悄写入缓存
    setTimeout(() => {
      localStorage.setItem(name, value);
    }, 0);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

type PlayerStore = {
  volume: number;
  isPlaying: boolean;
  currentSongDetail: SongDetail | null;
  currentSongUrl: string | null;
  totalTime: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: SongDetail[];
  queueIndex: number;
  lyric: NeteaseLyric | null;

  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setTotalTime: (time: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setQueue: (songs: SongDetail[], startIndex?: number) => void;
  setLyric: (lyric: NeteaseLyric | null) => void;

  fetchCurrentLyric: () => Promise<void>; // 补充歌词静默恢复函数
  playTrack: (song: SongDetail) => Promise<void>;
  playQueueIndex: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  playRandom: () => Promise<void>;
  cleanCache: () => void;
};

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    persist(
      (set, get) => ({
        volume: 100,
        isPlaying: false,
        currentSongDetail: null,
        currentSongUrl: null,
        totalTime: 0,
        repeatMode: "off",
        isShuffle: false,
        queue: [],
        queueIndex: -1,
        lyric: null,

        setVolume: (v) => set({ volume: v }),
        setIsPlaying: (v) => set({ isPlaying: v }),
        setTotalTime: (time) => set({ totalTime: time }),
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
          // 🚀 核心优化 2：合并碎片化的 Set 状态更新，把三次序列化缩减为一次
          set({
            currentSongDetail: song,
            currentSongUrl: null,
            isPlaying: false,
            lyric: null // 切歌时提前清空旧歌词
          });
          useTimeStore.getState().setCurrentTime(0);

          try {
            Promise.all([
              greySongUrlMatch(song.id),
              getLyric(song.id)
            ]).then(([urlRes, lyricRes]) => {
              const url = urlRes.data ?? urlRes.proxyUrl;
              set({
                currentSongUrl: url,
                isPlaying: true,
                totalTime: song.dt,
                lyric: lyricRes.data
              });
            }).catch((e) => {
              console.error("获取歌曲播放地址或歌词失败:", e);
              toast.error("获取歌曲播放地址或歌词失败");
              set({ currentSongUrl: null, isPlaying: false, lyric: null });
            });
          } catch (e) {
            console.error("获取歌曲播放地址失败:", e);
            toast.error("获取歌曲播放地址失败");
          }
        },

        playQueueIndex: async (index) => {
          const { queue, playTrack } = get();
          if (index < 0 || index >= queue.length) return;
          // 移除了重复的 currentTime: 0 操作，交给 playTrack 统一处理，减少渲染
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

        playRandom: async () => {
          const { queue, playQueueIndex } = get();
          if (!queue.length) return;
          const randomIndex = Math.floor(Math.random() * queue.length);
          await playQueueIndex(randomIndex);
        },

        cleanCache: () => {
          set({
            volume: 100,
            isPlaying: false,
            currentSongDetail: null,
            currentSongUrl: null,
            totalTime: 0,
            repeatMode: "off",
            isShuffle: false,
            queue: [],
            queueIndex: -1,
            lyric: null
          });
          useTimeStore.getState().setCurrentTime(0);
        }
      }),
      {
        name: 'player-storage',
        // 注入我们写好的宏任务防抖 Storage
        storage: createJSONStorage(() => asyncDebouncedStorage),
        partialize: (state) => ({
          volume: state.volume,
          currentSongDetail: state.currentSongDetail,
          currentSongUrl: state.currentSongUrl,
          // 🚀 核心优化 3：拦截超大数组，如果播放列表达到上千首，严格限制持久化的数量，防止 JSON.stringify 榨干 CPU
          queue: state.queue.length > 500 ? state.queue.slice(0, 500) : state.queue,
          queueIndex: state.queueIndex,
          repeatMode: state.repeatMode,
          isShuffle: state.isShuffle,
          // 🚨 极其重要：此配置中不包含 state.lyric，保证歌词只在内存中读写！
        }),
      }
    )
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "player-storage") {
      // 🚀 OPTIMIZE: 使用官方 rehydrate 杜绝多窗口事件造成的死循环写入
      usePlayerStore.persist.rehydrate();
    }
  });
}
