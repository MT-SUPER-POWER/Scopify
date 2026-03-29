import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NeteaseLyric, pruneNeteaseLyric, SongDetail } from "@/types/api/music";
import { getLyric, greySongUrlMatch } from "@/lib/api/music";
import { toast } from "sonner";
import { useTimeStore } from "@/store/module/time";

export type RepeatMode = "off" | "all" | "one";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type PlayerStore = {
  volume: number;
  isPlaying: boolean;
  currentSongDetail: SongDetail | null;
  currentSongUrl: string | null;
  repeatMode: RepeatMode;
  isShuffle: boolean;

  // 原始队列（用户添加的顺序）
  originalQueue: SongDetail[];
  // 当前播放的队列（可能是洗牌的，也可能是原始的）- 保持原名兼容现有代码
  queue: SongDetail[];

  queueIndex: number;
  historyStack: number[];
  historyIndex: number;

  lyric: NeteaseLyric | null;
  playlistId: number | string | null;

  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setQueue: (songs: SongDetail[], startIndex?: number, playlistId?: number | string | null) => void;
  setLyric: (lyric: NeteaseLyric | null) => void;
  setShuffle: (v: boolean) => void;

  playFromSong: (song: SongDetail, allSongs: SongDetail[], playlistId?: number | string | null) => Promise<void>;
  toggleShuffle: () => void;
  togglePlaying: () => void;
  fetchCurrentLyric: () => Promise<void>;
  playTrack: (song: SongDetail) => Promise<void>;
  playQueueIndex: (index: number, addToHistory?: boolean) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  reshuffleQueue: () => void;
  cleanCache: () => void;
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      volume: 100,
      isPlaying: false,
      currentSongDetail: null,
      currentSongUrl: null,
      repeatMode: "off",
      isShuffle: false,
      originalQueue: [],
      queue: [], // 保持原名，兼容现有代码
      queueIndex: -1,
      historyStack: [],
      historyIndex: -1,
      lyric: null,
      playlistId: null,

      setVolume: (v) => set({ volume: v }),
      setIsPlaying: (v) => set({ isPlaying: v }),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      setQueue: (songs, startIndex = 0, playlistId = null) => {
        const { isShuffle } = get();
        const queue = isShuffle ? shuffleArray(songs) : [...songs];

        set({
          originalQueue: songs,
          queue, // 保持原名
          queueIndex: startIndex,
          playlistId,
          historyStack: [startIndex],
          historyIndex: 0,
        });
      },
      setLyric: (lyric) => set({ lyric: pruneNeteaseLyric(lyric) }),
      setShuffle: (v) => set({ isShuffle: v }),

      playFromSong: async (song, allSongs, playlistId = null) => {
        const { isShuffle } = get();

        // 更新原始队列
        const songIndex = allSongs.findIndex(s => s.id === song.id);

        if (isShuffle) {
          // 随机模式：生成新队列，点击的歌放在第一位
          const remainingSongs = allSongs.filter(s => s.id !== song.id);
          const newQueue = [song, ...shuffleArray(remainingSongs)];

          set({
            originalQueue: allSongs,
            queue: newQueue,
            queueIndex: 0,
            historyStack: [0],
            historyIndex: 0,
            playlistId,
          });

          await get().playTrack(song);
        } else {
          // 顺序模式：正常设置队列，从点击的位置开始
          set({
            originalQueue: allSongs,
            queue: [...allSongs],
            queueIndex: songIndex,
            historyStack: [songIndex],
            historyIndex: 0,
            playlistId,
          });

          await get().playTrack(song);
        }
      },

      togglePlaying: () => set((state) => {
        if (!state.currentSongUrl) return state;
        return { isPlaying: !state.isPlaying };
      }),

      toggleShuffle: () => {
        const { isShuffle, originalQueue, queueIndex, queue } = get();
        const newShuffleState = !isShuffle;

        if (newShuffleState) {
          // 开启随机
          const currentSong = queue[queueIndex];
          const remainingSongs = originalQueue.filter(s => s.id !== currentSong?.id);
          const newQueue = currentSong
            ? [currentSong, ...shuffleArray(remainingSongs)]
            : shuffleArray(originalQueue);

          set({
            isShuffle: true,
            queue: newQueue, // 保持原名
            queueIndex: 0,
            historyStack: [0],
            historyIndex: 0,
          });
        } else {
          // 关闭随机，从当前歌曲位置继续顺序播放
          const currentSong = queue[queueIndex];
          const newIndex = currentSong
            ? originalQueue.findIndex(s => s.id === currentSong.id)
            : 0;

          set({
            isShuffle: false,
            queue: [...originalQueue], // 保持原名
            queueIndex: Math.max(0, newIndex),
            historyStack: [Math.max(0, newIndex)],
            historyIndex: 0,
          });
        }
      },

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
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setBufferedTime(0);
        set({ currentSongDetail: song, currentSongUrl: null, isPlaying: false });

        Promise.all([
          greySongUrlMatch(song.id),
          getLyric(song.id)
        ]).then(([urlRes, lyricRes]) => {
          const url = urlRes.data ?? urlRes.proxyUrl;
          useTimeStore.getState().setTotalTime(song.dt ?? 0);
          set({ currentSongUrl: url, isPlaying: true, lyric: lyricRes.data });
        }).catch((e) => {
          toast.error("获取歌曲播放地址或歌词失败");
          console.error("获取歌曲播放地址或歌词失败", e);
          set({ currentSongUrl: null, isPlaying: false, lyric: null });
        });
      },

      playQueueIndex: async (index, addToHistory = true) => {
        const { queue, historyStack, historyIndex } = get();
        if (index < 0 || index >= queue.length) return;

        let newHistoryStack = [...historyStack];
        let newHistoryIndex = historyIndex;

        if (addToHistory) {
          if (historyIndex < historyStack.length - 1) {
            newHistoryStack = newHistoryStack.slice(0, historyIndex + 1);
          }
          newHistoryStack.push(index);
          newHistoryIndex = newHistoryStack.length - 1;
        }

        set({
          queueIndex: index,
          historyStack: newHistoryStack,
          historyIndex: newHistoryIndex,
        });

        await get().playTrack(queue[index]);
      },

      playNext: async () => {
        const {
          queue,
          queueIndex,
          repeatMode,
          historyStack,
          historyIndex,
          reshuffleQueue
        } = get();

        if (!queue.length) return;

        // 历史前进
        if (historyIndex < historyStack.length - 1) {
          const nextIndex = historyStack[historyIndex + 1];
          set({ historyIndex: historyIndex + 1, queueIndex: nextIndex });
          await get().playTrack(queue[nextIndex]);
          return;
        }

        let nextIndex = queueIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            reshuffleQueue();
            nextIndex = 0;
          } else if (repeatMode === "one") {
            nextIndex = queueIndex;
          } else {
            set({ isPlaying: false });
            toast.success("You've reached the end of the queue");
            return;
          }
        }

        await get().playQueueIndex(nextIndex);
      },

      playPrev: async () => {
        const { historyIndex, historyStack, queue } = get();

        if (historyIndex > 0) {
          const prevIndex = historyStack[historyIndex - 1];
          set({
            historyIndex: historyIndex - 1,
            queueIndex: prevIndex
          });
          await get().playTrack(queue[prevIndex]);
          return;
        }

        if (queue.length > 0) {
          const prevIndex = queue.length - 1;
          set({ queueIndex: prevIndex });
          await get().playTrack(queue[prevIndex]);
        }
      },

      reshuffleQueue: () => {
        const { originalQueue, isShuffle, currentSongDetail } = get();
        if (!isShuffle || originalQueue.length === 0) return;

        const currentSong = currentSongDetail;
        const remainingSongs = originalQueue.filter(s => s.id !== currentSong?.id);
        const newQueue = currentSong
          ? [currentSong, ...shuffleArray(remainingSongs)]
          : shuffleArray(originalQueue);

        set({
          queue: newQueue, // 保持原名
          queueIndex: 0,
          historyStack: [0],
          historyIndex: 0,
        });
      },

      cleanCache: () => {
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setTotalTime(0);
        set({
          volume: 100,
          isPlaying: false,
          currentSongDetail: null,
          currentSongUrl: null,
          repeatMode: "off",
          isShuffle: false,
          originalQueue: [],
          queue: [], // 保持原名
          queueIndex: -1,
          historyStack: [],
          historyIndex: -1,
          lyric: null,
          playlistId: null,
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
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        originalQueue: state.originalQueue,
        queue: state.queue, // 保持原名
        queueIndex: state.queueIndex,
        historyStack: state.historyStack,
        historyIndex: state.historyIndex,
        lyric: state.lyric,
        playlistId: state.playlistId,
      }),
    }
  )
);
