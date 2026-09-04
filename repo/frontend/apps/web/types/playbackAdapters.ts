import type { AudioEngineAdapter, SourceResolution } from "@scopify/playback-core";

import type { MusicQualityLevel } from "@/types/api/music";
import type { PlaybackAuthorityMediaEvent, PlaybackMediaSample } from "@/types/playbackMediaPort";
import type { MusicQuality } from "@/types/player";

export type HtmlAudioMediaEventType = PlaybackAuthorityMediaEvent | "progress" | "time-update";

export interface HtmlAudioMediaEvent {
  bufferedPositionMs: number;
  errorCode: number | null;
  errorMessage: string | null;
  networkState: number;
  readyState: number;
  revision: number;
  sample: PlaybackMediaSample;
  type: HtmlAudioMediaEventType;
}

/** Web compatibility port while Zustand still owns the playback session. */
export interface HtmlAudioEngineAdapter extends AudioEngineAdapter {
  clearSource(revision?: number): void;
  getMediaSample(): PlaybackMediaSample;
  getSourceHost(): string | null;
  hasSource(): boolean;
  isCurrentSource(sourceUrl: string): boolean;
  isSourceLoading(): boolean;
  setRemoteSource(sourceUrl: string, revision: number): void;
  subscribeMedia(listener: (event: HtmlAudioMediaEvent) => void): () => void;
  waitForSource(sourceUrl: string, isCurrent: () => boolean): Promise<boolean>;
}

export interface NeteasePlayableSourceAdapterDependencies {
  clearCachedPlayUrl(songId: number, quality: MusicQuality): Promise<void>;
  getCachedPlayUrl(songId: number, quality: MusicQuality): Promise<string | null>;
  getSongUrlWithQuality(
    songId: number,
    level: MusicQualityLevel,
  ): Promise<{
    data: string | null | undefined;
    replayGainTrackGain?: number;
  }>;
  setCachedPlayUrl(songId: number, quality: MusicQuality, url: string): Promise<void>;
  setCachedReplayGain(songId: number, gainDb: number): Promise<void>;
}

export interface WebNeteasePlayableSourceResolver {
  /** Clears both core's in-memory source and the renderer's persistent URL. */
  invalidate(songId: number, quality: MusicQuality): Promise<void>;
  resolve(songId: number, quality: MusicQuality, signal?: AbortSignal): Promise<SourceResolution>;
}
