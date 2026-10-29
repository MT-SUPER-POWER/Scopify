import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackProjection,
  PlaybackTrack,
} from "@scopify/desktop-contract";

export interface PlaybackClock {
  nowMs(): number;
}

export interface AdjustablePlaybackClock extends PlaybackClock {
  advanceBy(durationMs: number): number;
  setNowMs(nowMs: number): void;
}

export type PlaybackCommandDispatcher = (
  command: PlaybackCommand,
) => Promise<PlaybackCommandReceipt>;

export interface PlaybackProjectionSource<TLyrics = unknown> {
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
  getSnapshot(): PlaybackProjection<TLyrics>;
  subscribe(listener: () => void): () => void;
}

export interface PlaybackPresentationTrack extends PlaybackTrack {
  durationMs: number;
}

export type PlaybackMessageRejectionReason =
  | "invalid-message"
  | "retired-authority"
  | "authority-bootstrap-required"
  | "bootstrap-required"
  | "duplicate-or-out-of-order"
  | "session-bootstrap-required"
  | "stale-timeline-revision"
  | "timeline-discontinuity-required"
  | "non-increasing-timeline-revision";

export type PlaybackMessageApplyResult =
  { accepted: true } | { accepted: false; detail?: string; reason: PlaybackMessageRejectionReason };

export interface PlaybackReplicaOptions {
  clock: PlaybackClock;
  disconnectAfterMs?: number;
  dispatchCommand?: PlaybackCommandDispatcher;
}

export type SwappablePlaybackSource<TLyrics> = PlaybackProjectionSource<TLyrics> & {
  replaceSource(source: PlaybackProjectionSource<TLyrics>): void;
};
