import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackMessage,
  PlaybackProjection,
  PlaybackTrack,
} from "@mt-super-power/desktop-contract";

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

export interface InMemoryPlaybackTransportOptions {
  clock: AdjustablePlaybackClock;
  disconnectAfterMs?: number;
  handleCommand?: PlaybackCommandDispatcher;
}

export interface InMemoryPlaybackDeliveryOptions {
  delayMs?: number;
}

export interface PendingPlaybackDelivery<TLyrics = unknown> {
  deliverAtMs: number;
  message: PlaybackMessage<TLyrics>;
  order: number;
}
