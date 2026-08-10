export const PLAYBACK_PROTOCOL_VERSION = 1 as const;
export const PLAYBACK_VOLUME_MAX = 100 as const;

export type PlaybackProtocolVersion = typeof PLAYBACK_PROTOCOL_VERSION;

export type PlaybackPhase =
  "idle" | "loading" | "playing" | "paused" | "buffering" | "ended" | "error";

export type PlaybackConnectionState = "connecting" | "connected" | "disconnected";

export interface PlaybackTrack {
  albumTitle?: string;
  artistNames: string[];
  artworkUrl?: string;
  id: number | string;
  title: string;
}

export interface PlaybackSessionState<TLyrics = unknown> {
  canControl: boolean;
  durationMs: number;
  liked: boolean;
  lyrics: TLyrics | null;
  lyricsVersion: number | string | null;
  phase: PlaybackPhase;
  track: PlaybackTrack | null;
  volume: number;
}

export interface PlaybackClockAnchor {
  positionMs: number;
  rate: number;
  sampledAtMs: number;
  timelineRevision: number;
}

export interface PlaybackReliableMessageBase {
  authorityId: string;
  protocolVersion: PlaybackProtocolVersion;
  sequence: number;
  sessionId: string;
}

export interface PlaybackBootstrap<TLyrics = unknown> extends PlaybackReliableMessageBase {
  anchor: PlaybackClockAnchor;
  state: PlaybackSessionState<TLyrics>;
  type: "bootstrap";
}

export interface PlaybackStateChanged<TLyrics = unknown> extends PlaybackReliableMessageBase {
  sampledAtMs: number;
  state: PlaybackSessionState<TLyrics>;
  timelineRevision: number;
  type: "state-changed";
}

export interface PlaybackClockAnchored extends PlaybackReliableMessageBase {
  anchor: PlaybackClockAnchor;
  type: "clock-anchored";
}

export type PlaybackTimelineDiscontinuityReason =
  "seek" | "track-change" | "resume" | "replay" | "media-correction";

export interface PlaybackTimelineDiscontinued extends PlaybackReliableMessageBase {
  anchor: PlaybackClockAnchor;
  causedByCommandId?: string;
  reason: PlaybackTimelineDiscontinuityReason;
  type: "timeline-discontinued";
}

export type PlaybackMessage<TLyrics = unknown> =
  | PlaybackBootstrap<TLyrics>
  | PlaybackStateChanged<TLyrics>
  | PlaybackClockAnchored
  | PlaybackTimelineDiscontinued;

export type PlaybackCommand =
  | { commandId: string; type: "toggle" }
  | { commandId: string; type: "play" | "pause" }
  | { commandId: string; type: "previous" | "next" }
  | { commandId: string; positionMs: number; type: "seek" }
  | { commandId: string; type: "set-volume"; volume: number }
  | { commandId: string; type: "toggle-like" };

export type PlaybackCommandReceipt =
  | { commandId: string; status: "accepted" }
  | { commandId: string; reason: string; status: "rejected" }
  | { commandId: string; reason?: string; status: "unavailable" };

export type PlaybackCommandValidationResult =
  { command: PlaybackCommand; success: true } | { reason: string; success: false };

export type PlaybackCommandReceiptValidationResult =
  { receipt: PlaybackCommandReceipt; success: true } | { reason: string; success: false };

export type PlaybackTransportRole = "authority" | "replica";

export interface PlaybackBootstrapRequest {
  type: "request-bootstrap";
}

export type PlaybackTransportControl = PlaybackBootstrapRequest;

export type PlaybackTransportPayload<TLyrics = unknown> =
  PlaybackCommand | PlaybackCommandReceipt | PlaybackMessage<TLyrics> | PlaybackTransportControl;

export interface PlaybackProjection<TLyrics = unknown> extends PlaybackSessionState<TLyrics> {
  connection: PlaybackConnectionState;
  isPlaying: boolean;
  positionMs: number;
  sessionId: string | null;
}

export type PlaybackMessageValidationResult<TLyrics = unknown> =
  { message: PlaybackMessage<TLyrics>; success: true } | { reason: string; success: false };

const PLAYBACK_PHASES: ReadonlySet<PlaybackPhase> = new Set([
  "idle",
  "loading",
  "playing",
  "paused",
  "buffering",
  "ended",
  "error",
]);

const TIMELINE_DISCONTINUITY_REASONS: ReadonlySet<PlaybackTimelineDiscontinuityReason> = new Set([
  "seek",
  "track-change",
  "resume",
  "replay",
  "media-correction",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && isFiniteNumber(value) && value >= 0;
}

function isPlaybackTrack(value: unknown): value is PlaybackTrack {
  if (!isRecord(value)) return false;

  return (
    (typeof value.id === "string" || isFiniteNumber(value.id)) &&
    typeof value.title === "string" &&
    Array.isArray(value.artistNames) &&
    value.artistNames.every((artistName) => typeof artistName === "string") &&
    (value.albumTitle === undefined || typeof value.albumTitle === "string") &&
    (value.artworkUrl === undefined || typeof value.artworkUrl === "string")
  );
}

function isPlaybackSessionState(value: unknown): value is PlaybackSessionState {
  if (!isRecord(value)) return false;

  return (
    typeof value.canControl === "boolean" &&
    isFiniteNumber(value.durationMs) &&
    value.durationMs >= 0 &&
    typeof value.liked === "boolean" &&
    (value.lyricsVersion === null ||
      typeof value.lyricsVersion === "string" ||
      isFiniteNumber(value.lyricsVersion)) &&
    typeof value.phase === "string" &&
    PLAYBACK_PHASES.has(value.phase as PlaybackPhase) &&
    (value.track === null || isPlaybackTrack(value.track)) &&
    isFiniteNumber(value.volume) &&
    value.volume >= 0 &&
    value.volume <= PLAYBACK_VOLUME_MAX &&
    "lyrics" in value
  );
}

function isPlaybackClockAnchor(value: unknown): value is PlaybackClockAnchor {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.positionMs) &&
    value.positionMs >= 0 &&
    isFiniteNumber(value.rate) &&
    value.rate >= 0 &&
    isFiniteNumber(value.sampledAtMs) &&
    isNonNegativeInteger(value.timelineRevision)
  );
}

function hasReliableMessageEnvelope(value: Record<string, unknown>): boolean {
  return (
    value.protocolVersion === PLAYBACK_PROTOCOL_VERSION &&
    typeof value.authorityId === "string" &&
    value.authorityId.length > 0 &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0 &&
    isNonNegativeInteger(value.sequence)
  );
}

export function validatePlaybackMessage<TLyrics = unknown>(
  value: unknown,
): PlaybackMessageValidationResult<TLyrics> {
  if (!isRecord(value)) return { reason: "message-not-an-object", success: false };
  if (value.protocolVersion !== PLAYBACK_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (!hasReliableMessageEnvelope(value)) {
    return { reason: "invalid-message-envelope", success: false };
  }

  let validPayload = false;
  switch (value.type) {
    case "bootstrap":
      validPayload = isPlaybackClockAnchor(value.anchor) && isPlaybackSessionState(value.state);
      break;
    case "state-changed":
      validPayload =
        isFiniteNumber(value.sampledAtMs) &&
        isNonNegativeInteger(value.timelineRevision) &&
        isPlaybackSessionState(value.state);
      break;
    case "clock-anchored":
      validPayload = isPlaybackClockAnchor(value.anchor);
      break;
    case "timeline-discontinued":
      validPayload =
        isPlaybackClockAnchor(value.anchor) &&
        typeof value.reason === "string" &&
        TIMELINE_DISCONTINUITY_REASONS.has(value.reason as PlaybackTimelineDiscontinuityReason) &&
        (value.causedByCommandId === undefined || typeof value.causedByCommandId === "string");
      break;
  }

  if (!validPayload) return { reason: "invalid-message-payload", success: false };
  return { message: value as unknown as PlaybackMessage<TLyrics>, success: true };
}

export function isPlaybackMessage<TLyrics = unknown>(
  value: unknown,
): value is PlaybackMessage<TLyrics> {
  return validatePlaybackMessage<TLyrics>(value).success;
}

export function validatePlaybackCommand(value: unknown): PlaybackCommandValidationResult {
  if (!isRecord(value)) return { reason: "command-not-an-object", success: false };
  if (typeof value.commandId !== "string" || value.commandId.length === 0) {
    return { reason: "invalid-command-id", success: false };
  }

  let validPayload = false;
  switch (value.type) {
    case "toggle":
    case "play":
    case "pause":
    case "previous":
    case "next":
    case "toggle-like":
      validPayload = true;
      break;
    case "seek":
      validPayload = isFiniteNumber(value.positionMs) && value.positionMs >= 0;
      break;
    case "set-volume":
      validPayload =
        isFiniteNumber(value.volume) && value.volume >= 0 && value.volume <= PLAYBACK_VOLUME_MAX;
      break;
  }

  if (!validPayload) return { reason: "invalid-command-payload", success: false };
  return { command: value as unknown as PlaybackCommand, success: true };
}

export function isPlaybackCommand(value: unknown): value is PlaybackCommand {
  return validatePlaybackCommand(value).success;
}

export function validatePlaybackCommandReceipt(
  value: unknown,
): PlaybackCommandReceiptValidationResult {
  if (!isRecord(value)) return { reason: "receipt-not-an-object", success: false };
  if (typeof value.commandId !== "string" || value.commandId.length === 0) {
    return { reason: "invalid-command-id", success: false };
  }

  const validPayload =
    value.status === "accepted" ||
    (value.status === "rejected" && typeof value.reason === "string") ||
    (value.status === "unavailable" &&
      (value.reason === undefined || typeof value.reason === "string"));

  if (!validPayload) return { reason: "invalid-receipt-payload", success: false };
  return { receipt: value as unknown as PlaybackCommandReceipt, success: true };
}

export function isPlaybackCommandReceipt(value: unknown): value is PlaybackCommandReceipt {
  return validatePlaybackCommandReceipt(value).success;
}

export function isPlaybackTransportControl(value: unknown): value is PlaybackTransportControl {
  return isRecord(value) && value.type === "request-bootstrap";
}
