import { type PlaybackSessionSeed, isPlaybackSessionSeed } from "./playbackHostControl";

/**
 * Versioned persisted recovery payload for the hidden Playback Host.
 *
 * A checkpoint contains only a fully validated session seed and the time it
 * was written. Source URLs, cookies, lyrics, and CDN state must be resolved
 * again by the runtime after restoration.
 */
export const PLAYBACK_CHECKPOINT_PROTOCOL_VERSION = 1 as const;

export type PlaybackCheckpointProtocolVersion = typeof PLAYBACK_CHECKPOINT_PROTOCOL_VERSION;

export interface PlaybackCheckpointV1 {
  protocolVersion: PlaybackCheckpointProtocolVersion;
  savedAtMs: number;
  session: PlaybackSessionSeed;
}

export type PlaybackCheckpoint = PlaybackCheckpointV1;

export type PlaybackCheckpointValidationResult =
  { checkpoint: PlaybackCheckpointV1; success: true } | { reason: string; success: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** Treat persisted data as untrusted: a prior version or damaged file must not restore. */
export function validatePlaybackCheckpoint(value: unknown): PlaybackCheckpointValidationResult {
  if (!isRecord(value)) return { reason: "checkpoint-not-an-object", success: false };
  if (!hasOnlyKeys(value, ["protocolVersion", "savedAtMs", "session"])) {
    return { reason: "checkpoint-has-unknown-fields", success: false };
  }
  if (value.protocolVersion !== PLAYBACK_CHECKPOINT_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (!isNonNegativeSafeInteger(value.savedAtMs)) {
    return { reason: "invalid-saved-at", success: false };
  }
  if (!isPlaybackSessionSeed(value.session)) {
    return { reason: "invalid-session-seed", success: false };
  }

  return { checkpoint: value as unknown as PlaybackCheckpointV1, success: true };
}

export function isPlaybackCheckpoint(value: unknown): value is PlaybackCheckpointV1 {
  return validatePlaybackCheckpoint(value).success;
}
