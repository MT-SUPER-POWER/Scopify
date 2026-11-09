import type { MusicResourceRef } from "./identity";
import type { MusicArtist } from "./track";

export interface MusicMv {
  ref: MusicResourceRef<"mv">;
  title: string;
  coverUrl: string | null;
  artists: readonly MusicArtist[];
  /** Null when the platform does not report the length. */
  durationMs: number | null;
  playCount: number | null;
}

/** A picture quality of an MV, identified by its height in pixels (480, 720, 1080). */
export interface MusicMvQuality {
  height: number;
  sizeBytes: number | null;
}

export interface MusicMvDetail extends MusicMv {
  description: string | null;
  /** Milliseconds since the epoch; null when unknown. */
  publishedAt: number | null;
  /** Qualities known before playing; empty when the platform names them only with the stream. */
  qualities: readonly MusicMvQuality[];
}

export interface MusicMvListRequest {
  offset: number;
  limit: number;
  signal?: AbortSignal;
}

export interface MusicMvPage {
  mvs: MusicMv[];
  hasMore: boolean;
}

export interface MusicMvPlaybackRequest {
  /** The tallest quality wanted; the platform serves the best one at or below it. Absent: best. */
  maxHeight?: number;
  signal?: AbortSignal;
}

/** A URL the video element can load now. Signed URLs expire, so it is never persisted. */
export interface MusicMvStream {
  url: string;
  /** The quality served; null when the platform does not say. */
  height: number | null;
  /** Every quality the platform offers for this MV; empty when it does not list them. */
  qualities: readonly MusicMvQuality[];
}

/**
 * MV reading and playback, implemented by every platform with `mv`. Subscribing to an MV and
 * liking it are NetEase's own and stay behind a NetEase check in the page.
 */
export interface MusicMvSource {
  getMv(mv: MusicResourceRef<"mv">, signal?: AbortSignal): Promise<MusicMvDetail>;
  /** `null` when the platform has no stream for the MV (no copyright, VIP only). */
  getMvStream(
    mv: MusicResourceRef<"mv">,
    request?: MusicMvPlaybackRequest,
  ): Promise<MusicMvStream | null>;
  /** The MVs of one track, the one for the song first; empty when it has none. */
  getTrackMvs(track: MusicResourceRef<"track">, signal?: AbortSignal): Promise<MusicMv[]>;
  /** MVs worth watching after this one; the platform decides what that means. */
  getRelatedMvs(mv: MusicMvDetail, request: MusicMvListRequest): Promise<MusicMvPage>;
}
