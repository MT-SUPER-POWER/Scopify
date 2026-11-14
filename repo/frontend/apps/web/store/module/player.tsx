import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { PLAYER_PERSISTENCE_STORAGE_KEY } from "@/constants/playbackPersistence";
import { getTrackLyric } from "@/lib/lyrics/cloudLyric";
import {
  getCachedLyric,
  getImportedLyricOverride,
  getLyricMatchOverride,
  getLyricSourceSelection,
  setCachedLyric,
} from "@/lib/cache/playbackCache";
import { translate } from "@/lib/i18n";
import { getPlaybackFailureAction } from "@/lib/player/playbackFailure";
import { isPlaybackLoadCurrent } from "@/lib/player/playbackLoad";
import { createPlaybackQueue, type PlaybackQueueSnapshot } from "@/lib/player/playbackQueue";
import {
  PLAYER_PERSISTENCE_VERSION,
  restorePersistedQueueState,
} from "@/lib/player/persistedPlayerState";
import { isSamePlayerTrack, playerTrackKey } from "@/lib/player/trackIdentity";
import { getMusicProvider } from "@/lib/providers";
import { getNeteaseTrackId, toNeteaseSongDetail } from "@/lib/providers/netease/adapters/track";
import { getVoiceNeteaseLyric } from "@/lib/lyrics/voiceLyric";
import { enrichSongStatsById } from "@/lib/song/enrichSongStats";
import { useI18nStore } from "@/store/module/i18n";
import { useTimeStore } from "@/store/module/time";
import type { LyricSource } from "@/types/lyrics/model";
import type { ImmerseType } from "@/types/song/api";
import type { MusicPlaybackRequest } from "@scopify/music-domain/playback";
import type { MusicQuality, PlayerStore, PlayerTrack } from "@/types/player/model";

export type {
  MusicQuality,
  PlaybackFailureSource,
  PlaybackNextSource,
  ReplayGainMode,
  RepeatMode,
  SourceChangeMode,
} from "@/types/player/model";

function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const playbackQueue = createPlaybackQueue<PlayerTrack>(shuffleArray, playerTrackKey);

/** The store keeps NetEase's quality names; the playback area uses neutral ones. */
function toPlaybackRequest(
  quality: MusicQuality,
  immerseType: ImmerseType,
): Omit<MusicPlaybackRequest, "signal"> {
  return {
    quality: quality === "jymaster" ? "master" : quality,
    ...(quality === "sky" ? { variant: immerseType } : {}),
  };
}

function createPlayerQueueSnapshot(state: PlayerStore): PlaybackQueueSnapshot<PlayerTrack> {
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

function selectPlayerQueueState(snapshot: PlaybackQueueSnapshot<PlayerTrack>) {
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

async function getStoredLyricSource(songId: number): Promise<LyricSource | null> {
  const [source, importedLyric, matchedLyric] = await Promise.all([
    getLyricSourceSelection(songId),
    getImportedLyricOverride(songId),
    getLyricMatchOverride(songId),
  ]);

  if (source === "imported" && importedLyric) return importedLyric.lyric;
  return matchedLyric?.lyric ?? null;
}

async function getVoiceLyricForPlayback(voiceId: number): Promise<LyricSource | null> {
  try {
    return await getVoiceNeteaseLyric(voiceId);
  } catch (error) {
    // A missing voice transcript must not make an otherwise playable voice fail.
    console.warn("获取声音文字稿失败，继续播放声音:", error);
    return null;
  }
}

/**
 * The lyric of a track about to play. NetEase songs honour a manual match or import and the
 * lyric cache (`useCache`); voices read their transcript; other platforms ask the provider
 * when it has lyrics. `shouldCache` tells whether the result is worth caching.
 */
async function loadTrackLyric(
  track: PlayerTrack,
  useCache: boolean,
): Promise<{ lyric: LyricSource | null; shouldCache: boolean }> {
  const neteaseId = getNeteaseTrackId(track);
  if (neteaseId !== null) {
    const voiceId = track.netease?.voiceId;
    if (voiceId !== undefined) {
      return { lyric: await getVoiceLyricForPlayback(voiceId), shouldCache: false };
    }
    const [storedLyric, cachedLyric] = await Promise.all([
      getStoredLyricSource(neteaseId),
      useCache ? getCachedLyric(neteaseId) : null,
    ]);
    if (storedLyric || cachedLyric) {
      return { lyric: storedLyric ?? cachedLyric, shouldCache: false };
    }
    return { lyric: await getTrackLyric(track), shouldCache: useCache };
  }

  if (!getMusicProvider(track.ref.provider).capabilities.has("track.lyrics")) {
    return { lyric: null, shouldCache: false };
  }
  try {
    return { lyric: await getTrackLyric(track), shouldCache: false };
  } catch (error) {
    // Missing lyrics must not stop a playable track.
    console.warn("获取歌词失败，继续播放:", error);
    return { lyric: null, shouldCache: false };
  }
}

export function selectPersistedPlayerState(state: PlayerStore) {
  return {
    volume: state.volume,
    currentTrack: state.currentTrack,
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
    immerseType: state.immerseType,
  };
}

export function mergePersistedPlayerState(
  persistedState: unknown,
  currentState: PlayerStore,
): PlayerStore {
  const persisted: Partial<PlayerStore> & { currentSongDetail?: unknown } = {
    ...(persistedState as Partial<PlayerStore> | undefined),
  };
  // Builds before interface tracks stored the current song under this key.
  delete persisted.currentSongDetail;
  return {
    ...currentState,
    ...persisted,
    // Old builds stored NetEase songs; anything unreadable is dropped rather than played.
    ...restorePersistedQueueState(persistedState),
    // Playback URLs are time-limited CDN capabilities. Never revive one
    // from an older app session, including payloads written by old builds.
    currentReplayGain: null,
    currentSongUrl: null,
    isPlaying: false,
    playbackFailureCount: 0,
  };
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      appendQueueItems: (songs) => {
        const snapshot = createPlayerQueueSnapshot(get());
        const transition = playbackQueue.appendQueueItems(snapshot, songs);
        if (transition.snapshot === snapshot) return;
        set(selectPlayerQueueState(transition.snapshot));
      },
      volume: 100,
      isPlaying: false,
      currentTrack: null,
      currentReplayGain: null,
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
      immerseType: "c51",
      sourceChangeMode: "new-track",
      setMusicQuality: (quality) => set({ musicQuality: quality }),
      changeMusicQuality: async (quality, nextImmerseType = get().immerseType) => {
        const { currentTrack, musicQuality, immerseType } = get();
        if (musicQuality === quality && immerseType === nextImmerseType) return;

        set({ musicQuality: quality, immerseType: nextImmerseType });
        if (!currentTrack) return;

        const didSwitch = await get().playTrack(currentTrack, {
          preservePlaybackSession: true,
        });
        if (
          !didSwitch &&
          get().musicQuality === quality &&
          get().immerseType === nextImmerseType &&
          isSamePlayerTrack(get().currentTrack, currentTrack)
        ) {
          set({ musicQuality, immerseType });
        }
      },
      setVolume: (v) => {
        set({ volume: v });
      },
      setIsPlaying: (isPlaying) => {
        const { currentTrack, currentSongUrl } = get();
        if (!isPlaying || currentSongUrl) {
          set({ isPlaying });
          return;
        }

        // Several legacy controls still express "play" as setIsPlaying(true).
        // Route that intent through the URL-aware resume path after hydration.
        if (currentTrack) void get().togglePlaying();
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
          { currentTrack: state.currentTrack },
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
          { currentTrack: state.currentTrack },
          index,
        );
        if (transition.snapshot === snapshot) return;
        set(selectPlayerQueueState(transition.snapshot));
      },
      removeQueueItem: (index, playFollowingOnly) => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.removeQueueItem(
          snapshot,
          { currentTrack: state.currentTrack },
          index,
          playFollowingOnly,
        );
        if (transition.snapshot === snapshot) return;

        if (transition.effect.type === "clear") {
          set({
            ...selectPlayerQueueState(transition.snapshot),
            currentTrack: null,
            currentReplayGain: null,
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
      setLyric: (lyric) => set({ lyric }),
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
        const { currentTrack, currentSongUrl, isPlaying } = get();
        if (currentSongUrl) {
          set({ isPlaying: !isPlaying });
          return;
        }
        if (!currentTrack || isPlaying) return;

        const didLoad = await get().playTrack(currentTrack, {
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
        const { currentTrack, lyric, playbackLoadRevision } = get();
        if (!currentTrack || lyric) return;
        const loadIdentity = {
          revision: playbackLoadRevision,
          trackKey: playerTrackKey(currentTrack),
        };
        try {
          const { lyric: lyricData } = await loadTrackLyric(currentTrack, false);
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
        const { currentTrack, musicQuality, immerseType } = get();
        if (!currentTrack) return { status: "superseded" };
        const trackKey = playerTrackKey(currentTrack);

        console.info("[player] Refreshing playback URL", {
          musicQuality,
          provider: currentTrack.ref.provider,
          trackId: currentTrack.ref.id,
        });
        set({
          currentSongUrl: null,
          playbackLoadRevision: get().playbackLoadRevision + 1,
          sourceChangeMode: "preserve-position",
        });
        const refreshRevision = get().playbackLoadRevision;
        const refreshIdentity = { revision: refreshRevision, trackKey };
        try {
          await getMusicProvider(currentTrack.ref.provider).invalidatePlayableSource(
            currentTrack.ref,
            toPlaybackRequest(musicQuality, immerseType),
          );
        } catch (error) {
          if (!isPlaybackLoadCurrent(get(), refreshIdentity)) return { status: "superseded" };
          console.error("清理过期播放地址失败", error);
          return { identity: refreshIdentity, status: "failed" };
        }
        if (
          !isPlaybackLoadCurrent(get(), refreshIdentity) ||
          get().musicQuality !== musicQuality ||
          get().immerseType !== immerseType
        ) {
          return { status: "superseded" };
        }

        const refreshPromise = get().playTrack(currentTrack, {
          preservePlaybackSession: true,
          resetFailureCount: false,
        });
        const loadIdentity = {
          revision: get().playbackLoadRevision,
          trackKey,
        };
        const refreshed = await refreshPromise;
        if (
          !isPlaybackLoadCurrent(get(), loadIdentity) ||
          get().musicQuality !== musicQuality ||
          get().immerseType !== immerseType
        ) {
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
          currentTrack: song,
          currentSongUrl: shouldPreservePlaybackSession ? get().currentSongUrl : null,
          ...(!shouldPreservePlaybackSession ? { currentReplayGain: null } : {}),
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
        const loadIdentity = { revision: requestLoadRevision, trackKey: playerTrackKey(song) };
        const isCurrentPlaybackLoad = () => isPlaybackLoadCurrent(get(), loadIdentity);
        // Lyrics and stats still come from NetEase; tracks from other platforms skip them.
        const neteaseSong = toNeteaseSongDetail(song);
        const neteaseId = getNeteaseTrackId(song);

        if (neteaseSong) {
          void enrichSongStatsById(
            neteaseSong.id,
            {
              likedCount: neteaseSong.likedCount,
              commentCount: neteaseSong.commentCount,
            },
            neteaseSong.voiceId,
          );
        }

        try {
          const { musicQuality, immerseType } = get();
          const lyricResult = loadTrackLyric(song, true);
          const [sourceResolution, resolvedLyric] = await Promise.all([
            getMusicProvider(song.ref.provider).resolvePlayableSource(
              song.ref,
              toPlaybackRequest(musicQuality, immerseType),
            ),
            lyricResult,
          ]);
          if (!isCurrentPlaybackLoad()) return false;
          if (sourceResolution.status !== "resolved") {
            throw new Error(sourceResolution.reason);
          }
          if (neteaseId !== null && resolvedLyric.lyric && resolvedLyric.shouldCache) {
            await setCachedLyric(neteaseId, resolvedLyric.lyric);
          }
          if (!isCurrentPlaybackLoad()) return false;
          useTimeStore.getState().setTotalTime(song.durationMs);
          set({
            currentReplayGain: sourceResolution.source.replayGain,
            currentSongUrl: sourceResolution.source.url,
            ...(shouldPreservePlaybackSession ? {} : { isPlaying: true }),
            lyric: resolvedLyric.lyric ?? null,
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
          { currentTrack: state.currentTrack },
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
        const state = get();
        if (isPersonalFmPlaybackSource(state.playlistId) && state.historyIndex <= 0) return;
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.playPrev(snapshot);
        if (transition.effect.type !== "play") return;
        set(selectPlayerQueueState(transition.snapshot));
        await get().playTrack(transition.effect.track);
      },

      reshuffleQueue: () => {
        const state = get();
        const snapshot = createPlayerQueueSnapshot(state);
        const transition = playbackQueue.reshuffleQueue(snapshot, {
          currentTrack: state.currentTrack,
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
          currentTrack: null,
          currentReplayGain: null,
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
      version: PLAYER_PERSISTENCE_VERSION,
      // `merge` reads both stored shapes, so older versions need no separate step.
      migrate: (persistedState) => persistedState as PlayerStore,
      storage: createJSONStorage(() => localStorage),
      partialize: selectPersistedPlayerState,
      merge: mergePersistedPlayerState,
    },
  ),
);
