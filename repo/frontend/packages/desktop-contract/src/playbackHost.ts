import type { AudioFeatureFrameV1 } from "./audioFeature";
import type { PlaybackTransportPayload } from "./playback";
import type { PlaybackHostClientCommand, PlaybackHostHostMessage } from "./playbackHostControl";

/**
 * The hidden Playback Host is intentionally not a general Desktop renderer.
 * Its bridge exposes only the three duties the authority needs: prove it is
 * the window created for this load, own the reliable playback port, and
 * publish best-effort audio features.
 */
export const PLAYBACK_HOST_RENDERER_READY_CHANNEL = "playback-host:renderer-ready";
export const PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL = "playback-host:media-playing";
export const PLAYBACK_HOST_NONCE_MAX_LENGTH = 128;

export type PlaybackHostBridgeCapability =
  "audio-feature-publisher" | "media-playing" | "playback-authority" | "renderer-ready";

export interface PlaybackHostRendererReadyRequest {
  nonce: string;
}

export interface PlaybackHostMediaPlayingRequest {
  isPlaying: boolean;
}

export type PlaybackHostUnsubscribe = () => void;

export interface PlaybackHostBridge<TLyrics = unknown> {
  /** Returns the nonce embedded into the URL of this exact host load. */
  getNonce(): string | null;
  /** Sends the per-load proof to the main process after runtime initialization. */
  reportReady(nonce: string): void;
  /** Updates native media affordances; it cannot control any BrowserWindow. */
  setMediaPlaying(isPlaying: boolean): void;
  /** Connects the sole reliable transport role exposed to the host: authority. */
  connectPlaybackTransport(
    connectionId: string,
    onPayload: (payload: PlaybackTransportPayload<TLyrics>) => void,
    onClose: () => void,
  ): PlaybackHostUnsubscribe;
  sendPlaybackTransportPayload(payload: PlaybackTransportPayload<TLyrics>): boolean;
  /** Connects the host side of the low-frequency session-control channel. */
  connectPlaybackHostControl(
    connectionId: string,
    onPayload: (payload: PlaybackHostClientCommand) => void,
    onClose: () => void,
  ): PlaybackHostUnsubscribe;
  /** Sends receipts and session snapshots back to the visible client. */
  sendPlaybackHostControlPayload(payload: PlaybackHostHostMessage): boolean;
  /** Connects the sole high-frequency transport role exposed to the host: publisher. */
  connectAudioFeatureTransport(connectionId: string, onClose: () => void): PlaybackHostUnsubscribe;
  publishAudioFeatureFrame(frame: AudioFeatureFrameV1): boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isPlaybackHostNonce(value: unknown): value is string {
  return (
    typeof value === "string" && value.length > 0 && value.length <= PLAYBACK_HOST_NONCE_MAX_LENGTH
  );
}

/** Treat all renderer-originated IPC as untrusted, even from the dedicated preload. */
export function parsePlaybackHostRendererReadyRequest(
  value: unknown,
): PlaybackHostRendererReadyRequest | null {
  if (!isRecord(value) || !isPlaybackHostNonce(value.nonce)) return null;
  return { nonce: value.nonce };
}

/** Validates the only native media-state mutation available to the Host renderer. */
export function parsePlaybackHostMediaPlayingRequest(
  value: unknown,
): PlaybackHostMediaPlayingRequest | null {
  if (!isRecord(value) || typeof value.isPlaying !== "boolean") return null;
  return { isPlaying: value.isPlaying };
}
