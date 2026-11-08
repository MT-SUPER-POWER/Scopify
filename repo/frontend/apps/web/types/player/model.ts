import type { MusicReplayGain } from "@scopify/music-domain/playback";
import type { MusicTrack } from "@scopify/music-domain/track";

import type { NeteaseTrackExtras } from "@/types/providers/netease/trackApi";
import type { ImmerseType, NeteaseLyric } from "@/types/song/api";

export type MusicQuality =
  "sky" | "jymaster" | "dolby" | "vivid" | "spatial" | "hires" | "lossless" | "high" | "standard";
export type PlaybackFailureSource = "url" | "audio";
/** Identifies why queue progression occurred so source-specific policies can react correctly. */
export type PlaybackNextSource = "manual" | "ended" | "personal-fm-dislike";
export type RepeatMode = "off" | "all" | "one";
export type ReplayGainMode = "off" | "track" | "album";
export type SourceChangeMode = "new-track" | "preserve-position";

/**
 * A queue entry: interface metadata, plus the NetEase-only fields when it came from NetEase.
 * Platform-specific playback details (fee, privilege, quality tiers) stay in `netease`.
 */
export type PlayerTrack = MusicTrack & { readonly netease?: NeteaseTrackExtras };

export interface PlaybackLoadIdentity {
  revision: number;
  /** `musicResourceKey` of the track being loaded. */
  trackKey: string;
}

export type PlaybackSourceRefreshResult =
  | { status: "refreshed" }
  | { identity: PlaybackLoadIdentity; status: "failed" }
  | { status: "superseded" };

export interface PlayTrackOptions {
  preservePlaybackSession?: boolean;
  resetFailureCount?: boolean;
}

export type PlayQueueIndexOptions = PlayTrackOptions;

export interface PlayerStore {
  appendQueueItems: (songs: PlayerTrack[]) => void;
  currentTrack: PlayerTrack | null;
  /** ReplayGain the platform reported with the current source; null when unknown. */
  currentReplayGain: MusicReplayGain | null;
  currentSongUrl: string | null;
  changeMusicQuality: (quality: MusicQuality, immerseType?: ImmerseType) => Promise<void>;
  immerseType: ImmerseType;
  fetchCurrentLyric: () => Promise<void>;
  handlePlaybackFailure: (
    source: PlaybackFailureSource,
    identity?: PlaybackLoadIdentity,
  ) => Promise<void>;
  historyIndex: number;
  historyStack: number[];
  isPlaying: boolean;
  isShuffle: boolean;
  lyric: NeteaseLyric | null;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  moveQueueItemToNext: (index: number) => void;
  musicQuality: MusicQuality;
  originalQueue: PlayerTrack[];
  playFromSong: (
    song: PlayerTrack,
    allSongs: PlayerTrack[],
    playlistId?: number | string | null,
  ) => Promise<void>;
  playbackFailureCount: number;
  playbackLoadRevision: number;
  playbackSessionRevision: number;
  playNext: (source?: PlaybackNextSource) => Promise<void>;
  playPrev: () => Promise<void>;
  playQueueIndex: (
    index: number,
    addToHistory?: boolean,
    options?: PlayQueueIndexOptions,
  ) => Promise<void>;
  playTrack: (song: PlayerTrack, options?: PlayTrackOptions) => Promise<boolean>;
  playlistId: number | string | null;
  queue: PlayerTrack[];
  queueIndex: number;
  refreshCurrentTrackUrl: () => Promise<PlaybackSourceRefreshResult>;
  cleanCache: () => void;
  removeQueueItem: (index: number) => void;
  reshuffleQueue: () => void;
  repeatMode: RepeatMode;
  replayGainMode: ReplayGainMode;
  setIsPlaying: (isPlaying: boolean) => void;
  setLyric: (lyric: NeteaseLyric | null) => void;
  setMusicQuality: (quality: MusicQuality) => void;
  setQueue: (
    songs: PlayerTrack[],
    startIndex?: number,
    playlistId?: number | string | null,
  ) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setReplayGainMode: (mode: ReplayGainMode) => void;
  setShuffle: (isShuffle: boolean) => void;
  setVolume: (volume: number) => void;
  sourceChangeMode: SourceChangeMode;
  togglePlaying: () => Promise<void>;
  toggleShuffle: () => void;
  volume: number;
}

export interface UseMediaSessionOptions {
  audioRef: { current: HTMLAudioElement | null };
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
}
