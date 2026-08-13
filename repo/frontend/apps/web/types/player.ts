import type { NeteaseLyric, SongDetail } from "@/types/api/music";

export type MusicQuality =
  "sky" | "jymaster" | "dolby" | "spatial" | "hires" | "lossless" | "high" | "standard";
export type PlaybackFailureSource = "url" | "audio";
export type PlaybackNextSource = "manual" | "ended";
export type RepeatMode = "off" | "all" | "one";
export type SourceChangeMode = "new-track" | "preserve-position";

export interface PlaybackLoadIdentity {
  revision: number;
  trackId: number;
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
  currentSongDetail: SongDetail | null;
  currentSongUrl: string | null;
  changeMusicQuality: (quality: MusicQuality) => Promise<void>;
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
  originalQueue: SongDetail[];
  playFromSong: (
    song: SongDetail,
    allSongs: SongDetail[],
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
  playTrack: (song: SongDetail, options?: PlayTrackOptions) => Promise<boolean>;
  playlistId: number | string | null;
  queue: SongDetail[];
  queueIndex: number;
  refreshCurrentTrackUrl: () => Promise<PlaybackSourceRefreshResult>;
  cleanCache: () => void;
  removeQueueItem: (index: number) => void;
  reshuffleQueue: () => void;
  repeatMode: RepeatMode;
  setIsPlaying: (isPlaying: boolean) => void;
  setLyric: (lyric: NeteaseLyric | null) => void;
  setMusicQuality: (quality: MusicQuality) => void;
  setQueue: (songs: SongDetail[], startIndex?: number, playlistId?: number | string | null) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffle: (isShuffle: boolean) => void;
  setVolume: (volume: number) => void;
  sourceChangeMode: SourceChangeMode;
  togglePlaying: () => Promise<void>;
  toggleShuffle: () => void;
  volume: number;
}
