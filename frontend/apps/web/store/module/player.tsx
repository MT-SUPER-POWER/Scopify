import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getLyric, getSongUrlWithQuality, UI_QUALITY_TO_LEVEL } from "@/lib/api/music";
import {
  clearCachedPlayUrl,
  getCachedLyric,
  getCachedPlayUrl,
  getImportedLyricOverride,
  getLyricMatchOverride,
  getLyricSourceSelection,
  setCachedLyric,
  setCachedPlayUrl,
} from "@/lib/cache/playbackCache";
import { translate } from "@/lib/i18n";
import { getPlaybackFailureAction } from "@/lib/player/playbackFailure";
import { isPlaybackLoadCurrent } from "@/lib/player/playbackLoad";
import { enrichSongStatsById } from "@/lib/song/enrichSongStats";
import { useI18nStore } from "@/store/module/i18n";
import { useTimeStore } from "@/store/module/time";
import { pruneNeteaseLyric, type NeteaseLyric } from "@/types/api/music";
import type { PlayerStore } from "@/types/player";

export type {
  MusicQuality,
  PlaybackFailureSource,
  PlaybackNextSource,
  RepeatMode,
  SourceChangeMode,
} from "@/types/player";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function getStoredLyricSource(songId: number): Promise<NeteaseLyric | null> {
  const [source, importedLyric, matchedLyric] = await Promise.all([
    getLyricSourceSelection(songId),
    getImportedLyricOverride(songId),
    getLyricMatchOverride(songId),
  ]);

  if (source === "imported" && importedLyric) return importedLyric.lyric;
  return matchedLyric?.lyric ?? null;
}

export function selectPersistedPlayerState(state: PlayerStore) {
  return {
    volume: state.volume,
    currentSongDetail: state.currentSongDetail,
    repeatMode: state.repeatMode,
    isShuffle: state.isShuffle,
    originalQueue: state.originalQueue,
    queue: state.queue,
    queueIndex: state.queueIndex,
    historyStack: state.historyStack,
    historyIndex: state.historyIndex,
    lyric: state.lyric,
    playlistId: state.playlistId,
    musicQuality: state.musicQuality,
  };
}

export function mergePersistedPlayerState(
  persistedState: unknown,
  currentState: PlayerStore,
): PlayerStore {
  return {
    ...currentState,
    ...(persistedState as Partial<PlayerStore>),
    // Playback URLs are time-limited CDN capabilities. Never revive one
    // from an older app session, including payloads written by old builds.
    currentSongUrl: null,
    isPlaying: false,
    playbackFailureCount: 0,
  };
}

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
      playbackFailureCount: 0,
      playbackLoadRevision: 0,
      playbackSessionRevision: 0,
      musicQuality: "high",
      sourceChangeMode: "new-track",
      setMusicQuality: (quality) => set({ musicQuality: quality }),
      changeMusicQuality: async (quality) => {
        const { currentSongDetail, musicQuality } = get();
        if (musicQuality === quality) return;

        set({ musicQuality: quality });
        if (!currentSongDetail) return;

        const didSwitch = await get().playTrack(currentSongDetail, {
          preservePlaybackSession: true,
        });
        if (
          !didSwitch &&
          get().musicQuality === quality &&
          get().currentSongDetail?.id === currentSongDetail.id
        ) {
          set({ musicQuality });
        }
      },
      setVolume: (v) => set({ volume: v }),
      setIsPlaying: (isPlaying) => {
        const { currentSongDetail, currentSongUrl } = get();
        if (!isPlaying || currentSongUrl) {
          set({ isPlaying });
          return;
        }

        // Several legacy controls still express "play" as setIsPlaying(true).
        // Route that intent through the URL-aware resume path after hydration.
        if (currentSongDetail) void get().togglePlaying();
      },
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      moveQueueItem: (fromIndex, toIndex) => {
        const { currentSongDetail, queue } = get();
        if (
          fromIndex < 0 ||
          fromIndex >= queue.length ||
          toIndex < 0 ||
          toIndex >= queue.length ||
          fromIndex === toIndex
        ) {
          return;
        }
        const reordered = [...queue];
        const [item] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, item);
        const nextCurrentIndex = currentSongDetail
          ? reordered.findIndex(
              (song) => song === currentSongDetail || song.id === currentSongDetail.id,
            )
          : -1;
        set({
          historyIndex: nextCurrentIndex >= 0 ? 0 : -1,
          historyStack: nextCurrentIndex >= 0 ? [nextCurrentIndex] : [],
          originalQueue: [...reordered],
          queue: reordered,
          queueIndex: nextCurrentIndex,
        });
      },
      moveQueueItemToNext: (index) => {
        const { queue, queueIndex } = get();
        if (index < 0 || index >= queue.length || index === queueIndex) return;
        const insertAfterCurrent = index < queueIndex ? queueIndex : queueIndex + 1;
        get().moveQueueItem(index, Math.min(queue.length - 1, insertAfterCurrent));
      },
      removeQueueItem: (index) => {
        const { currentSongDetail, queue, queueIndex } = get();
        if (index < 0 || index >= queue.length) return;
        const nextQueue = queue.filter((_, itemIndex) => itemIndex !== index);
        if (nextQueue.length === 0) {
          set({
            currentSongDetail: null,
            currentSongUrl: null,
            historyIndex: -1,
            historyStack: [],
            isPlaying: false,
            lyric: null,
            originalQueue: [],
            playbackLoadRevision: get().playbackLoadRevision + 1,
            queue: [],
            queueIndex: -1,
          });
          return;
        }

        const removedCurrent = index === queueIndex || queue[index]?.id === currentSongDetail?.id;
        const nextCurrentIndex = removedCurrent
          ? Math.min(index, nextQueue.length - 1)
          : index < queueIndex
            ? queueIndex - 1
            : queueIndex;
        set({
          historyIndex: 0,
          historyStack: [nextCurrentIndex],
          originalQueue: [...nextQueue],
          queue: nextQueue,
          queueIndex: nextCurrentIndex,
        });
        if (removedCurrent) void get().playTrack(nextQueue[nextCurrentIndex]);
      },
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
        const songIndex = allSongs.findIndex((s) => s.id === song.id);

        if (isShuffle) {
          // 随机模式：生成新队列，点击的歌放在第一位
          const remainingSongs = allSongs.filter((s) => s.id !== song.id);
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

      togglePlaying: async () => {
        const { currentSongDetail, currentSongUrl, isPlaying } = get();
        if (currentSongUrl) {
          set({ isPlaying: !isPlaying });
          return;
        }
        if (!currentSongDetail || isPlaying) return;

        const didLoad = await get().playTrack(currentSongDetail, {
          preservePlaybackSession: true,
        });
        if (didLoad) set({ isPlaying: true });
      },

      toggleShuffle: () => {
        const { isShuffle, originalQueue, queueIndex, queue } = get();
        const newShuffleState = !isShuffle;

        if (newShuffleState) {
          // 开启随机
          const currentSong = queue[queueIndex];
          const remainingSongs = originalQueue.filter((s) => s.id !== currentSong?.id);
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
            ? originalQueue.findIndex((s) => s.id === currentSong.id)
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
        const { currentSongDetail, lyric, playbackLoadRevision } = get();
        if (!currentSongDetail || lyric) return;
        const songId = currentSongDetail.id;
        const loadIdentity = { revision: playbackLoadRevision, trackId: songId };
        try {
          const storedLyric = await getStoredLyricSource(songId);
          const lyricRes = storedLyric ? { data: storedLyric } : await getLyric(songId);
          if (!isPlaybackLoadCurrent(get(), loadIdentity)) return;
          set({ lyric: lyricRes.data });
        } catch (e) {
          console.error("静默恢复歌词失败:", e);
        }
      },

      handlePlaybackFailure: async (source, identity) => {
        if (identity && !isPlaybackLoadCurrent(get(), identity)) return;

        const { queue, queueIndex, playbackFailureCount } = get();
        const hasNextTrack = queueIndex >= 0 && queueIndex < queue.length - 1;
        const action = getPlaybackFailureAction(playbackFailureCount, hasNextTrack);
        const locale = useI18nStore.getState().locale;

        console.warn("Playback failed:", {
          source,
          queueIndex,
          playbackFailureCount,
          action: action.type,
        });

        if (action.type === "skip") {
          set({ playbackFailureCount: action.nextFailureCount });
          toast.info(translate(locale, "common.message.playbackAutoSkipped"), {
            id: "playback-auto-skipped",
          });
          await get().playQueueIndex(queueIndex + 1, true, {
            resetFailureCount: false,
          });
          return;
        }

        set({
          currentSongUrl: null,
          isPlaying: false,
          lyric: null,
          playbackFailureCount: action.nextFailureCount,
          playbackLoadRevision: get().playbackLoadRevision + 1,
        });
        toast.error(translate(locale, "common.message.playbackConsecutiveFailed"), {
          id: "playback-consecutive-failed",
        });
      },

      refreshCurrentTrackUrl: async () => {
        const { currentSongDetail, musicQuality } = get();
        if (!currentSongDetail) return { status: "superseded" };
        const songId = currentSongDetail.id;

        console.info("[player] Refreshing playback URL", {
          musicQuality,
          songId: currentSongDetail.id,
        });
        set({
          currentSongUrl: null,
          playbackLoadRevision: get().playbackLoadRevision + 1,
          sourceChangeMode: "preserve-position",
        });
        const refreshRevision = get().playbackLoadRevision;
        const refreshIdentity = { revision: refreshRevision, trackId: songId };
        try {
          await clearCachedPlayUrl(songId, musicQuality);
        } catch (error) {
          if (!isPlaybackLoadCurrent(get(), refreshIdentity)) return { status: "superseded" };
          console.error("清理过期播放地址失败", error);
          return { identity: refreshIdentity, status: "failed" };
        }
        if (!isPlaybackLoadCurrent(get(), refreshIdentity) || get().musicQuality !== musicQuality) {
          return { status: "superseded" };
        }

        const refreshPromise = get().playTrack(currentSongDetail, {
          preservePlaybackSession: true,
          resetFailureCount: false,
        });
        const loadIdentity = {
          revision: get().playbackLoadRevision,
          trackId: songId,
        };
        const refreshed = await refreshPromise;
        if (!isPlaybackLoadCurrent(get(), loadIdentity) || get().musicQuality !== musicQuality) {
          return { status: "superseded" };
        }
        return refreshed ? { status: "refreshed" } : { identity: loadIdentity, status: "failed" };
      },

      playTrack: async (song, options = {}) => {
        const shouldPreservePlaybackSession = options.preservePlaybackSession ?? false;
        const shouldResetFailureCount = options.resetFailureCount ?? true;
        if (!shouldPreservePlaybackSession) {
          useTimeStore.getState().setCurrentTime(0);
          useTimeStore.getState().setBufferedTime(0);
        }
        set({
          currentSongDetail: song,
          currentSongUrl: shouldPreservePlaybackSession ? get().currentSongUrl : null,
          isPlaying: shouldPreservePlaybackSession ? get().isPlaying : false,
          playbackLoadRevision: get().playbackLoadRevision + 1,
          sourceChangeMode: shouldPreservePlaybackSession ? "preserve-position" : "new-track",
          ...(!shouldPreservePlaybackSession
            ? {
                lyric: null,
                playbackSessionRevision: get().playbackSessionRevision + 1,
              }
            : {}),
          ...(shouldResetFailureCount ? { playbackFailureCount: 0 } : {}),
        });
        const requestLoadRevision = get().playbackLoadRevision;
        const loadIdentity = { revision: requestLoadRevision, trackId: song.id };
        const isCurrentPlaybackLoad = () => isPlaybackLoadCurrent(get(), loadIdentity);

        void enrichSongStatsById(song.id, {
          likedCount: song.likedCount,
          commentCount: song.commentCount,
        });

        try {
          const { musicQuality } = get();
          const level = UI_QUALITY_TO_LEVEL[musicQuality] || "exhigh";

          // ── 1. Try cache ────────────────────────────────────────────────
          const [cachedUrl, cachedLyric, storedLyric] = await Promise.all([
            getCachedPlayUrl(song.id, musicQuality),
            getCachedLyric(song.id),
            getStoredLyricSource(song.id),
          ]);
          if (!isCurrentPlaybackLoad()) return false;
          const matchedLyric = storedLyric ?? cachedLyric;

          if (cachedUrl) {
            // URL 缓存命中
            if (matchedLyric) {
              // 歌词也命中 → 完全短路，无需 API 请求
              console.log("[Cache] HIT: URL + lyric for song", song.id);
              useTimeStore.getState().setTotalTime(song.dt ?? 0);
              set({
                currentSongUrl: cachedUrl,
                ...(shouldPreservePlaybackSession ? {} : { isPlaying: true }),
                lyric: matchedLyric,
                playbackFailureCount: 0,
              });
              return true;
            }
            // 仅 URL 命中 → 设置 URL，只请求歌词
            console.log(
              "[Cache] PARTIAL: URL hit (",
              musicQuality,
              "), lyric miss for song",
              song.id,
            );
            set({ currentSongUrl: cachedUrl });
            const lyricRes = await getLyric(song.id);
            const lyricData = lyricRes.data;
            if (lyricData) await setCachedLyric(song.id, lyricData);
            if (!isCurrentPlaybackLoad()) return false;
            useTimeStore.getState().setTotalTime(song.dt ?? 0);
            set({
              ...(shouldPreservePlaybackSession ? {} : { isPlaying: true }),
              lyric: lyricData ?? null,
              playbackFailureCount: 0,
            });
            return true;
          }

          // ── 2. Cache miss → fetch both ─────────────────────────────────
          console.log("[Cache] MISS: fetching URL + lyric for song", song.id);
          const [urlRes, lyricRes] = await Promise.all([
            getSongUrlWithQuality(song.id, level),
            storedLyric ? Promise.resolve({ data: storedLyric }) : getLyric(song.id),
          ]);
          if (!isCurrentPlaybackLoad()) return false;
          const url = urlRes.data;

          if (!url) {
            throw new Error("Playback URL is empty");
          }

          // 写入缓存
          console.log("[Cache] WRITE: URL + lyric for song", song.id);
          // URL and lyric share one cache record. Serialize the writes so each
          // update merges the latest record instead of racing and dropping data.
          await setCachedPlayUrl(song.id, musicQuality, url);
          if (lyricRes.data && !storedLyric) {
            await setCachedLyric(song.id, lyricRes.data);
          }
          if (!isCurrentPlaybackLoad()) return false;
          const lyricData2 = lyricRes.data;

          useTimeStore.getState().setTotalTime(song.dt ?? 0);
          set({
            currentSongUrl: url,
            ...(shouldPreservePlaybackSession ? {} : { isPlaying: true }),
            lyric: lyricData2 ?? null,
            playbackFailureCount: 0,
          });
          return true;
        } catch (e) {
          if (!isCurrentPlaybackLoad()) return false;
          console.error("获取歌曲播放地址或歌词失败", e);
          if (shouldPreservePlaybackSession) return false;
          await get().handlePlaybackFailure("url", loadIdentity);
          return false;
        }
      },

      playQueueIndex: async (index, addToHistory = true, options = {}) => {
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

        await get().playTrack(queue[index], options);
      },

      playNext: async (source = "manual") => {
        const { queue, queueIndex, repeatMode, historyStack, historyIndex, reshuffleQueue } = get();

        if (!queue.length) return;

        if (
          source === "ended" &&
          repeatMode === "one" &&
          queueIndex >= 0 &&
          queueIndex < queue.length
        ) {
          await get().playQueueIndex(queueIndex, false);
          return;
        }

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
            await get().playQueueIndex(queueIndex, false);
            return;
          } else {
            set({ isPlaying: false });
            toast.success(translate(useI18nStore.getState().locale, "common.message.endOfQueue"));
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
            queueIndex: prevIndex,
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
        const remainingSongs = originalQueue.filter((s) => s.id !== currentSong?.id);
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
          playbackFailureCount: 0,
          playbackLoadRevision: get().playbackLoadRevision + 1,
          playbackSessionRevision: get().playbackSessionRevision + 1,
        });
      },
    }),
    {
      name: "player-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: selectPersistedPlayerState,
      merge: mergePersistedPlayerState,
    },
  ),
);
