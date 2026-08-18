import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PLAYER_PERSISTENCE_STORAGE_KEY } from "@/constants/playbackPersistence";
import { getLyric, getSongUrlWithQuality, UI_QUALITY_TO_LEVEL } from "@/lib/api/music";
import {
  clearCachedPlayUrl,
  getCachedLyric,
  getCachedPlayUrl,
  getCachedReplayGain,
  getImportedLyricOverride,
  getLyricMatchOverride,
  getLyricSourceSelection,
  setCachedLyric,
  setCachedPlayUrl,
  setCachedReplayGain,
} from "@/lib/cache/playbackCache";
import { translate } from "@/lib/i18n";
import { getPlaybackFailureAction } from "@/lib/player/playbackFailure";
import { isPlaybackLoadCurrent } from "@/lib/player/playbackLoad";
import { createPlaybackQueue, type PlaybackQueueSnapshot } from "@/lib/player/playbackQueue";
import { getVoiceNeteaseLyric } from "@/lib/lyrics/voiceLyric";
import { enrichSongStatsById } from "@/lib/song/enrichSongStats";
import { useI18nStore } from "@/store/module/i18n";
import { useTimeStore } from "@/store/module/time";
import { pruneNeteaseLyric, type NeteaseLyric, type SongDetail } from "@/types/api/music";
import type { PlayerStore } from "@/types/player";

export type {
  MusicQuality,
  PlaybackFailureSource,
  PlaybackNextSource,
  ReplayGainMode,
  RepeatMode,
  SourceChangeMode,
} from "@/types/player";

function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const playbackQueue = createPlaybackQueue<SongDetail>(shuffleArray);

function createPlayerQueueSnapshot(state: PlayerStore): PlaybackQueueSnapshot<SongDetail> {
  return {
    historyIndex: state.historyIndex,
    historyStack: state.historyStack,
    isShuffle: state.isShuffle,
    originalQueue: state.originalQueue,
    playlistId: state.playlistId,
    queue: state.queue,
    queueIndex: state.queueIndex,
    repeatMode: state.repeatMode,
  };
}

function selectPlayerQueueState(snapshot: PlaybackQueueSnapshot<SongDetail>) {
  return {
    historyIndex: snapshot.historyIndex,
    historyStack: snapshot.historyStack,
    isShuffle: snapshot.isShuffle,
    originalQueue: snapshot.originalQueue,
    playlistId: snapshot.playlistId,
    queue: snapshot.queue,
    queueIndex: snapshot.queueIndex,
    repeatMode: snapshot.repeatMode,
  } satisfies Pick<
    PlayerStore,
    | "historyIndex"
    | "historyStack"
    | "isShuffle"
    | "originalQueue"
    | "playlistId"
    | "queue"
    | "queueIndex"
    | "repeatMode"
  >;
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

async function getVoiceLyricForPlayback(song: SongDetail): Promise<NeteaseLyric | null> {
  if (song.voiceId === undefined) return null;

  try {
    return await getVoiceNeteaseLyric(song.voiceId);
  } catch (error) {
    // A missing voice transcript must not make an otherwise playable voice fail.
    console.warn("获取声音文字稿失败，继续播放声音:", error);
    return null;
  }
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
      replayGainMode: "off",
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
      setVolume: (v) => {
        set({ volume: v });
      },
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
      setRepeatMode: (mode) => {
        const snapshot = createPlayerQueueSnapshot(get());
        const transition = playbackQueue.setRepeatMode(snapshot, mode);
        set(selectPlayerQueueState(transition.snapshot));
      },
      setReplayGainMode: (replayGainMode) => set({ replayGainMode }),
      moveQueueItem: (fromIndex, toIndex) => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.moveQueueItem(
          snapshot,
          { currentTrack: state.currentSongDetail },
          fromIndex,
          toIndex,
        );
        if (transition.snapshot === snapshot) return;
        set(selectPlayerQueueState(transition.snapshot));
      },
      moveQueueItemToNext: (index) => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.moveQueueItemToNext(
          snapshot,
          { currentTrack: state.currentSongDetail },
          index,
        );
        if (transition.snapshot === snapshot) return;
        set(selectPlayerQueueState(transition.snapshot));
      },
      removeQueueItem: (index) => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.removeQueueItem(
          snapshot,
          { currentTrack: state.currentSongDetail },
          index,
        );
        if (transition.snapshot === snapshot) return;

        if (transition.effect.type === "clear") {
          set({
            ...selectPlayerQueueState(transition.snapshot),
            currentSongDetail: null,
            currentSongUrl: null,
            isPlaying: false,
            lyric: null,
            playbackLoadRevision: state.playbackLoadRevision + 1,
          });
          return;
        }

        set(selectPlayerQueueState(transition.snapshot));
        if (transition.effect.type === "play") void get().playTrack(transition.effect.track);
      },
      setQueue: (songs, startIndex = 0, playlistId = null) => {
        const snapshot = createPlayerQueueSnapshot(get());
        const transition = playbackQueue.setQueue(snapshot, songs, startIndex, playlistId);
        set(selectPlayerQueueState(transition.snapshot));
      },
      setLyric: (lyric) => set({ lyric: pruneNeteaseLyric(lyric) }),
      setShuffle: (v) => {
        const snapshot = createPlayerQueueSnapshot(get());
        const transition = playbackQueue.setShuffle(snapshot, v);
        set(selectPlayerQueueState(transition.snapshot));
      },

      playFromSong: async (song, allSongs, playlistId = null) => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.playFromSong(snapshot, song, allSongs, playlistId);
        set(selectPlayerQueueState(transition.snapshot));
        if (transition.effect.type === "play") await get().playTrack(transition.effect.track);
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
        const snapshot = createPlayerQueueSnapshot(get());
        const transition = playbackQueue.toggleShuffle(snapshot);
        set(selectPlayerQueueState(transition.snapshot));
      },

      fetchCurrentLyric: async () => {
        const { currentSongDetail, lyric, playbackLoadRevision } = get();
        if (!currentSongDetail || lyric) return;
        const songId = currentSongDetail.id;
        const loadIdentity = { revision: playbackLoadRevision, trackId: songId };
        try {
          const storedLyric =
            currentSongDetail.voiceId === undefined ? await getStoredLyricSource(songId) : null;
          const lyricData =
            currentSongDetail.voiceId === undefined
              ? storedLyric
                ? storedLyric
                : (await getLyric(songId)).data
              : await getVoiceLyricForPlayback(currentSongDetail);
          if (!isPlaybackLoadCurrent(get(), loadIdentity)) return;
          set({ lyric: lyricData });
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

        void enrichSongStatsById(
          song.id,
          {
            likedCount: song.likedCount,
            commentCount: song.commentCount,
          },
          song.voiceId,
        );

        try {
          const { musicQuality } = get();
          const level = UI_QUALITY_TO_LEVEL[musicQuality] || "exhigh";

          // ── 1. Try cache ────────────────────────────────────────────────
          const [cachedUrl, cachedReplayGain, cachedLyric, storedLyric] = await Promise.all([
            getCachedPlayUrl(song.id, musicQuality),
            getCachedReplayGain(song.id),
            song.voiceId === undefined ? getCachedLyric(song.id) : Promise.resolve(null),
            song.voiceId === undefined ? getStoredLyricSource(song.id) : Promise.resolve(null),
          ]);
          if (!isCurrentPlaybackLoad()) return false;
          const matchedLyric = storedLyric ?? cachedLyric;
          const cachedSong =
            cachedReplayGain !== null && Number.isFinite(cachedReplayGain)
              ? { ...song, replayGain: cachedReplayGain, replayGainTrackGain: cachedReplayGain }
              : song;

          if (cachedUrl) {
            // URL 缓存命中
            if (matchedLyric) {
              // 歌词也命中 → 完全短路，无需 API 请求
              console.log("[Cache] HIT: URL + lyric for song", song.id);
              useTimeStore.getState().setTotalTime(song.dt ?? 0);
              set({
                currentSongDetail: cachedSong,
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
            set({ currentSongDetail: cachedSong, currentSongUrl: cachedUrl });
            const lyricData =
              song.voiceId === undefined
                ? storedLyric
                  ? storedLyric
                  : (await getLyric(song.id)).data
                : await getVoiceLyricForPlayback(song);
            if (lyricData && song.voiceId === undefined && !storedLyric) {
              await setCachedLyric(song.id, lyricData);
            }
            if (!isCurrentPlaybackLoad()) return false;
            useTimeStore.getState().setTotalTime(song.dt ?? 0);
            set({
              currentSongDetail: cachedSong,
              ...(shouldPreservePlaybackSession ? {} : { isPlaying: true }),
              lyric: lyricData ?? null,
              playbackFailureCount: 0,
            });
            return true;
          }

          // ── 2. Cache miss → fetch both ─────────────────────────────────
          console.log("[Cache] MISS: fetching URL + lyric for song", song.id);
          const [urlRes, lyricData] = await Promise.all([
            getSongUrlWithQuality(song.id, level),
            song.voiceId === undefined
              ? storedLyric
                ? Promise.resolve(storedLyric)
                : getLyric(song.id).then((response) => response.data)
              : getVoiceLyricForPlayback(song),
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
          if (urlRes.replayGainTrackGain != null) {
            await setCachedReplayGain(song.id, urlRes.replayGainTrackGain);
          }
          if (lyricData && song.voiceId === undefined && !storedLyric) {
            await setCachedLyric(song.id, lyricData);
          }
          if (!isCurrentPlaybackLoad()) return false;
          useTimeStore.getState().setTotalTime(song.dt ?? 0);
          set({
            currentSongDetail:
              urlRes.replayGainTrackGain != null
                ? {
                    ...song,
                    replayGain: urlRes.replayGainTrackGain,
                    replayGainTrackGain: urlRes.replayGainTrackGain,
                  }
                : song,
            currentSongUrl: url,
            ...(shouldPreservePlaybackSession ? {} : { isPlaying: true }),
            lyric: lyricData ?? null,
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
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.playQueueIndex(snapshot, index, addToHistory);
        if (transition.snapshot === snapshot) return;

        set(selectPlayerQueueState(transition.snapshot));
        if (transition.effect.type === "play") {
          await get().playTrack(transition.effect.track, options);
        }
      },

      playNext: async (source = "manual") => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.playNext(
          snapshot,
          { currentTrack: state.currentSongDetail },
          source,
        );
        if (transition.effect.type === "none") return;
        if (transition.effect.type === "stop") {
          set({ isPlaying: false });
          toast.success(translate(useI18nStore.getState().locale, "common.message.endOfQueue"));
          return;
        }

        set(selectPlayerQueueState(transition.snapshot));
        if (transition.effect.type === "play") await get().playTrack(transition.effect.track);
      },

      playPrev: async () => {
        const snapshot = createPlayerQueueSnapshot(get());
        const transition = playbackQueue.playPrev(snapshot);
        if (transition.effect.type !== "play") return;
        set(selectPlayerQueueState(transition.snapshot));
        await get().playTrack(transition.effect.track);
      },

      reshuffleQueue: () => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.reshuffleQueue(snapshot, {
          currentTrack: state.currentSongDetail,
        });
        if (transition.snapshot === snapshot) return;
        set(selectPlayerQueueState(transition.snapshot));
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
      name: PLAYER_PERSISTENCE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: selectPersistedPlayerState,
      merge: mergePersistedPlayerState,
    },
  ),
);
