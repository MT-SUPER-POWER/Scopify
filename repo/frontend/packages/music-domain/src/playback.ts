import type { MusicResourceRef } from "./identity";

/**
 * Quality tiers in the player's own vocabulary. A platform maps them to its levels and may
 * serve a lower tier than asked for; tiers it does not know fall back to its best match.
 */
export type MusicPlaybackQuality =
  "standard" | "high" | "lossless" | "hires" | "master" | "dolby" | "vivid" | "spatial" | "sky";

export interface MusicPlaybackRequest {
  quality: MusicPlaybackQuality;
  /** A variant of the tier (the immersive type of `sky`); platforms without variants ignore it. */
  variant?: string;
  signal?: AbortSignal;
}

/** Loudness metadata for ReplayGain; any value the platform does not report is left out. */
export interface MusicReplayGain {
  trackGainDb?: number;
  trackPeak?: number;
  albumGainDb?: number;
  albumPeak?: number;
}

/** A URL the audio element can load now. Signed URLs expire, so it is never persisted. */
export interface MusicPlayableSource {
  url: string;
  replayGain: MusicReplayGain | null;
}

export type MusicPlaybackResolution =
  | { status: "resolved"; source: MusicPlayableSource }
  /** `retryable` is false when asking again will not help (no copyright, VIP only, no URL). */
  | { status: "unavailable"; reason: string; retryable: boolean };

/** Turns a track reference into something playable. */
export interface MusicPlaybackSource {
  resolvePlayableSource(
    track: MusicResourceRef<"track">,
    request: MusicPlaybackRequest,
  ): Promise<MusicPlaybackResolution>;
  /** Forgets any cached source for the track, so the next resolve asks the platform again. */
  invalidatePlayableSource(
    track: MusicResourceRef<"track">,
    request: Omit<MusicPlaybackRequest, "signal">,
  ): Promise<void>;
}
