/**
 * Versioned, low-frequency session-control protocol between the visible
 * renderer and the hidden Playback Host. This channel deliberately carries
 * cloneable state only: it never transports media URLs, cookies, or renderer
 * callbacks.
 */
export const PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION = 1 as const;
export const PLAYBACK_HOST_CONTROL_MAX_ID_LENGTH = 128 as const;
export const PLAYBACK_HOST_CONTROL_MAX_TEXT_LENGTH = 1_024 as const;
export const PLAYBACK_HOST_CONTROL_MAX_QUEUE_ENTRIES = 10_000 as const;
export const PLAYBACK_HOST_CONTROL_MAX_ARTISTS_PER_ENTRY = 64 as const;
export const PLAYBACK_HOST_CONTROL_MAX_ALIASES_PER_ENTRY = 32 as const;

export type PlaybackHostControlProtocolVersion = typeof PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION;
export type PlaybackHostControlTransportRole = "client" | "host";
export type PlaybackHostPlaybackIntent = "pause" | "play";
export type PlaybackHostRepeatMode = "all" | "off" | "one";

/** Matches the supported quality choices without serializing a source URL. */
export type PlaybackHostMusicQuality =
  "sky" | "jymaster" | "dolby" | "spatial" | "hires" | "lossless" | "high" | "standard";

export interface PlaybackQueueArtist {
  id: number;
  name: string;
}

export interface PlaybackQueueAlbum {
  artworkUrl: string;
  id: number;
  title: string;
}

/**
 * Intentionally minimal queue representation. It contains enough stable data
 * for UI projection and playback selection, but excludes API response baggage.
 */
export interface PlaybackQueueEntry {
  alias?: string[];
  album: PlaybackQueueAlbum;
  artists: PlaybackQueueArtist[];
  durationMs: number;
  fee: number;
  id: number;
  publishTime: number;
  title: string;
  voiceId?: number;
}

/**
 * A full queue snapshot, not just the active list. Preserving originalQueue
 * and history is required to retain shuffle, previous, and repeat semantics.
 */
export interface PlaybackQueueSeed {
  historyIndex: number;
  historyStack: number[];
  originalQueue: PlaybackQueueEntry[];
  playlistId: number | string | null;
  queue: PlaybackQueueEntry[];
  queueIndex: number;
  repeatMode: PlaybackHostRepeatMode;
  shuffleEnabled: boolean;
}

/**
 * Runtime-owned revision prevents the client from treating a stale port
 * message as a newer playback session. It is monotonically managed by the
 * runtime; this contract only validates its wire representation.
 */
export interface PlaybackSessionSeed {
  intent: PlaybackHostPlaybackIntent;
  quality: PlaybackHostMusicQuality;
  queue: PlaybackQueueSeed;
  resumePositionMs: number;
  revision: number;
  volume: number;
}

export interface PlaybackHostReplaceSessionCommand {
  commandId: string;
  protocolVersion: PlaybackHostControlProtocolVersion;
  session: PlaybackSessionSeed;
  type: "replace-session";
}

/**
 * Host-side queue commands deliberately contain intents, never a client-side
 * queue snapshot. The Playback Host is the sole executor of the queue state
 * machine, so a Main renderer can request an operation without becoming a
 * second queue owner while it waits for the resulting session snapshot.
 */
export interface PlaybackHostSelectQueueIndexCommand {
  addToHistory: boolean;
  commandId: string;
  index: number;
  protocolVersion: PlaybackHostControlProtocolVersion;
  type: "select-queue-index";
}

/**
 * Replaces the canonical queue. `play: true` is the lossless representation
 * of the existing play-from-song flow; `play: false` represents a pure
 * setQueue update without touching the current media source.
 */
export interface PlaybackHostReplaceQueueCommand {
  commandId: string;
  playlistId: PlaybackQueueSeed["playlistId"];
  play: boolean;
  protocolVersion: PlaybackHostControlProtocolVersion;
  queue: PlaybackQueueEntry[];
  startIndex: number;
  type: "replace-queue";
}

export interface PlaybackHostSetRepeatModeCommand {
  commandId: string;
  protocolVersion: PlaybackHostControlProtocolVersion;
  repeatMode: PlaybackHostRepeatMode;
  type: "set-repeat-mode";
}

export interface PlaybackHostSetShuffleCommand {
  commandId: string;
  enabled: boolean;
  protocolVersion: PlaybackHostControlProtocolVersion;
  type: "set-shuffle";
}

export interface PlaybackHostToggleShuffleCommand {
  commandId: string;
  protocolVersion: PlaybackHostControlProtocolVersion;
  type: "toggle-shuffle";
}

export interface PlaybackHostReshuffleQueueCommand {
  commandId: string;
  protocolVersion: PlaybackHostControlProtocolVersion;
  type: "reshuffle-queue";
}

export interface PlaybackHostMoveQueueItemCommand {
  commandId: string;
  fromIndex: number;
  protocolVersion: PlaybackHostControlProtocolVersion;
  toIndex: number;
  type: "move-queue-item";
}

export interface PlaybackHostMoveQueueItemToNextCommand {
  commandId: string;
  index: number;
  protocolVersion: PlaybackHostControlProtocolVersion;
  type: "move-queue-item-to-next";
}

export interface PlaybackHostRemoveQueueItemCommand {
  commandId: string;
  index: number;
  protocolVersion: PlaybackHostControlProtocolVersion;
  type: "remove-queue-item";
}

export type PlaybackHostQueueCommand =
  | PlaybackHostSelectQueueIndexCommand
  | PlaybackHostReplaceQueueCommand
  | PlaybackHostSetRepeatModeCommand
  | PlaybackHostSetShuffleCommand
  | PlaybackHostToggleShuffleCommand
  | PlaybackHostReshuffleQueueCommand
  | PlaybackHostMoveQueueItemCommand
  | PlaybackHostMoveQueueItemToNextCommand
  | PlaybackHostRemoveQueueItemCommand;

/** Every control-plane message Main may send to the one authoritative Host. */
export type PlaybackHostClientCommand =
  PlaybackHostReplaceSessionCommand | PlaybackHostQueueCommand;

export interface PlaybackHostControlReceipt {
  commandId: string;
  protocolVersion: PlaybackHostControlProtocolVersion;
  reason?: string;
  revision: number;
  status: "applied" | "rejected";
  type: "command-receipt";
}

export interface PlaybackHostSessionSnapshot {
  protocolVersion: PlaybackHostControlProtocolVersion;
  session: PlaybackSessionSeed;
  type: "session-snapshot";
}

export type PlaybackHostHostMessage = PlaybackHostControlReceipt | PlaybackHostSessionSnapshot;

export type PlaybackHostControlPayload = PlaybackHostClientCommand | PlaybackHostHostMessage;

export type PlaybackHostControlValidationResult =
  { payload: PlaybackHostControlPayload; success: true } | { reason: string; success: false };

export type PlaybackHostReplaceSessionCommandValidationResult =
  | { command: PlaybackHostReplaceSessionCommand; success: true }
  | { reason: string; success: false };

export type PlaybackHostQueueCommandValidationResult =
  { command: PlaybackHostQueueCommand; success: true } | { reason: string; success: false };

export type PlaybackHostClientCommandValidationResult =
  { command: PlaybackHostClientCommand; success: true } | { reason: string; success: false };

export type PlaybackHostControlReceiptValidationResult =
  { receipt: PlaybackHostControlReceipt; success: true } | { reason: string; success: false };

export type PlaybackHostSessionSnapshotValidationResult =
  { snapshot: PlaybackHostSessionSnapshot; success: true } | { reason: string; success: false };

const MUSIC_QUALITIES: ReadonlySet<PlaybackHostMusicQuality> = new Set([
  "sky",
  "jymaster",
  "dolby",
  "spatial",
  "hires",
  "lossless",
  "high",
  "standard",
]);

const REPEAT_MODES: ReadonlySet<PlaybackHostRepeatMode> = new Set(["all", "off", "one"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isBoundedText(value: unknown, allowEmpty = false): value is string {
  return (
    typeof value === "string" &&
    value.length <= PLAYBACK_HOST_CONTROL_MAX_TEXT_LENGTH &&
    (allowEmpty || value.length > 0)
  );
}

function isBoundedId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= PLAYBACK_HOST_CONTROL_MAX_ID_LENGTH
  );
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isQueueArtist(value: unknown): value is PlaybackQueueArtist {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "name"])) return false;
  return isNonNegativeSafeInteger(value.id) && isBoundedText(value.name);
}

function isQueueAlbum(value: unknown): value is PlaybackQueueAlbum {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "title", "artworkUrl"])) return false;
  return (
    isNonNegativeSafeInteger(value.id) &&
    isBoundedText(value.title) &&
    isBoundedText(value.artworkUrl)
  );
}

function isAliasList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= PLAYBACK_HOST_CONTROL_MAX_ALIASES_PER_ENTRY &&
    value.every((alias) => isBoundedText(alias))
  );
}

export function isPlaybackQueueEntry(value: unknown): value is PlaybackQueueEntry {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "id",
      "title",
      "durationMs",
      "artists",
      "album",
      "fee",
      "publishTime",
      "voiceId",
      "alias",
    ])
  ) {
    return false;
  }

  return (
    isNonNegativeSafeInteger(value.id) &&
    isBoundedText(value.title) &&
    isFiniteNonNegativeNumber(value.durationMs) &&
    Array.isArray(value.artists) &&
    value.artists.length <= PLAYBACK_HOST_CONTROL_MAX_ARTISTS_PER_ENTRY &&
    value.artists.every(isQueueArtist) &&
    isQueueAlbum(value.album) &&
    isNonNegativeSafeInteger(value.fee) &&
    isNonNegativeSafeInteger(value.publishTime) &&
    (value.voiceId === undefined || isNonNegativeSafeInteger(value.voiceId)) &&
    (value.alias === undefined || isAliasList(value.alias))
  );
}

function isPlaylistId(value: unknown): value is PlaybackQueueSeed["playlistId"] {
  return value === null || isNonNegativeSafeInteger(value) || isBoundedId(value);
}

function hasValidQueueIndexes(value: PlaybackQueueSeed): boolean {
  const queueLength = value.queue.length;
  if (queueLength === 0) {
    return value.queueIndex === -1 && value.historyIndex === -1 && value.historyStack.length === 0;
  }

  if (value.queueIndex < 0 || value.queueIndex >= queueLength) return false;
  if (value.historyStack.length === 0) return false;
  if (value.historyIndex < 0 || value.historyIndex >= value.historyStack.length) return false;
  if (!value.historyStack.every((index) => index >= 0 && index < queueLength)) return false;
  return value.historyStack[value.historyIndex] === value.queueIndex;
}

export function isPlaybackQueueSeed(value: unknown): value is PlaybackQueueSeed {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "originalQueue",
      "queue",
      "queueIndex",
      "historyStack",
      "historyIndex",
      "shuffleEnabled",
      "repeatMode",
      "playlistId",
    ])
  ) {
    return false;
  }

  if (
    !Array.isArray(value.originalQueue) ||
    !Array.isArray(value.queue) ||
    !Array.isArray(value.historyStack) ||
    value.originalQueue.length > PLAYBACK_HOST_CONTROL_MAX_QUEUE_ENTRIES ||
    value.queue.length > PLAYBACK_HOST_CONTROL_MAX_QUEUE_ENTRIES ||
    value.historyStack.length > PLAYBACK_HOST_CONTROL_MAX_QUEUE_ENTRIES ||
    !value.originalQueue.every(isPlaybackQueueEntry) ||
    !value.queue.every(isPlaybackQueueEntry) ||
    !value.historyStack.every(isNonNegativeSafeInteger) ||
    !Number.isInteger(value.queueIndex) ||
    !Number.isInteger(value.historyIndex) ||
    typeof value.shuffleEnabled !== "boolean" ||
    typeof value.repeatMode !== "string" ||
    !REPEAT_MODES.has(value.repeatMode as PlaybackHostRepeatMode) ||
    !isPlaylistId(value.playlistId)
  ) {
    return false;
  }

  const queueSeed = value as unknown as PlaybackQueueSeed;
  if ((queueSeed.queue.length === 0) !== (queueSeed.originalQueue.length === 0)) return false;
  return hasValidQueueIndexes(queueSeed);
}

export function isPlaybackSessionSeed(value: unknown): value is PlaybackSessionSeed {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["revision", "intent", "quality", "resumePositionMs", "volume", "queue"])
  ) {
    return false;
  }

  return (
    isNonNegativeSafeInteger(value.revision) &&
    (value.intent === "play" || value.intent === "pause") &&
    typeof value.quality === "string" &&
    MUSIC_QUALITIES.has(value.quality as PlaybackHostMusicQuality) &&
    isFiniteNonNegativeNumber(value.resumePositionMs) &&
    typeof value.volume === "number" &&
    Number.isFinite(value.volume) &&
    value.volume >= 0 &&
    value.volume <= 1 &&
    isPlaybackQueueSeed(value.queue)
  );
}

function isQueueCommandHeader(value: Record<string, unknown>, type: string): boolean {
  return (
    value.type === type &&
    value.protocolVersion === PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION &&
    isBoundedId(value.commandId)
  );
}

function isQueueCommandIndex(value: unknown): value is number {
  return isNonNegativeSafeInteger(value);
}

function isPlaybackQueueEntryList(value: unknown): value is PlaybackQueueEntry[] {
  return (
    Array.isArray(value) &&
    value.length <= PLAYBACK_HOST_CONTROL_MAX_QUEUE_ENTRIES &&
    value.every(isPlaybackQueueEntry)
  );
}

export function validatePlaybackHostReplaceSessionCommand(
  value: unknown,
): PlaybackHostReplaceSessionCommandValidationResult {
  if (!isRecord(value)) return { reason: "command-not-an-object", success: false };
  if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "session"])) {
    return { reason: "command-has-unknown-fields", success: false };
  }
  if (value.type !== "replace-session") return { reason: "invalid-command-type", success: false };
  if (value.protocolVersion !== PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (!isBoundedId(value.commandId)) return { reason: "invalid-command-id", success: false };
  if (!isPlaybackSessionSeed(value.session))
    return { reason: "invalid-session-seed", success: false };

  return {
    command: value as unknown as PlaybackHostReplaceSessionCommand,
    success: true,
  };
}

/** Validates only queue operations; replace-session remains the bootstrap/recovery command. */
export function validatePlaybackHostQueueCommand(
  value: unknown,
): PlaybackHostQueueCommandValidationResult {
  if (!isRecord(value)) return { reason: "command-not-an-object", success: false };
  if (value.protocolVersion !== PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (!isBoundedId(value.commandId)) return { reason: "invalid-command-id", success: false };

  switch (value.type) {
    case "select-queue-index":
      if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "index", "addToHistory"])) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (!isQueueCommandHeader(value, "select-queue-index") || !isQueueCommandIndex(value.index)) {
        return { reason: "invalid-select-queue-index-command", success: false };
      }
      if (typeof value.addToHistory !== "boolean") {
        return { reason: "invalid-add-to-history", success: false };
      }
      break;
    case "replace-queue":
      if (
        !hasOnlyKeys(value, [
          "type",
          "protocolVersion",
          "commandId",
          "queue",
          "startIndex",
          "playlistId",
          "play",
        ])
      ) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (
        !isQueueCommandHeader(value, "replace-queue") ||
        !isPlaybackQueueEntryList(value.queue) ||
        !isQueueCommandIndex(value.startIndex) ||
        !isPlaylistId(value.playlistId) ||
        typeof value.play !== "boolean"
      ) {
        return { reason: "invalid-replace-queue-command", success: false };
      }
      // An empty queue has no selectable start, and a queue replacement must
      // not permit an out-of-range selection through a malformed transport.
      if (
        (value.queue.length === 0 && value.startIndex !== 0) ||
        (value.queue.length > 0 && value.startIndex >= value.queue.length)
      ) {
        return { reason: "invalid-replace-queue-start-index", success: false };
      }
      break;
    case "set-repeat-mode":
      if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "repeatMode"])) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (
        !isQueueCommandHeader(value, "set-repeat-mode") ||
        !REPEAT_MODES.has(value.repeatMode as PlaybackHostRepeatMode)
      ) {
        return { reason: "invalid-set-repeat-mode-command", success: false };
      }
      break;
    case "set-shuffle":
      if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "enabled"])) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (!isQueueCommandHeader(value, "set-shuffle") || typeof value.enabled !== "boolean") {
        return { reason: "invalid-set-shuffle-command", success: false };
      }
      break;
    case "toggle-shuffle":
    case "reshuffle-queue":
      if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId"])) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (!isQueueCommandHeader(value, value.type)) {
        return { reason: "invalid-queue-command", success: false };
      }
      break;
    case "move-queue-item":
      if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "fromIndex", "toIndex"])) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (
        !isQueueCommandHeader(value, "move-queue-item") ||
        !isQueueCommandIndex(value.fromIndex) ||
        !isQueueCommandIndex(value.toIndex)
      ) {
        return { reason: "invalid-move-queue-item-command", success: false };
      }
      break;
    case "move-queue-item-to-next":
    case "remove-queue-item":
      if (!hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "index"])) {
        return { reason: "command-has-unknown-fields", success: false };
      }
      if (!isQueueCommandHeader(value, value.type) || !isQueueCommandIndex(value.index)) {
        return { reason: "invalid-indexed-queue-command", success: false };
      }
      break;
    default:
      return { reason: "invalid-queue-command-type", success: false };
  }

  return { command: value as unknown as PlaybackHostQueueCommand, success: true };
}

export function validatePlaybackHostClientCommand(
  value: unknown,
): PlaybackHostClientCommandValidationResult {
  const replacement = validatePlaybackHostReplaceSessionCommand(value);
  if (replacement.success) return { command: replacement.command, success: true };

  const queueCommand = validatePlaybackHostQueueCommand(value);
  if (queueCommand.success) return { command: queueCommand.command, success: true };

  return { reason: "invalid-playback-host-client-command", success: false };
}

export function validatePlaybackHostControlReceipt(
  value: unknown,
): PlaybackHostControlReceiptValidationResult {
  if (!isRecord(value)) return { reason: "receipt-not-an-object", success: false };
  if (
    !hasOnlyKeys(value, ["type", "protocolVersion", "commandId", "revision", "status", "reason"])
  ) {
    return { reason: "receipt-has-unknown-fields", success: false };
  }
  if (value.type !== "command-receipt") return { reason: "invalid-receipt-type", success: false };
  if (value.protocolVersion !== PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (!isBoundedId(value.commandId)) return { reason: "invalid-command-id", success: false };
  if (!isNonNegativeSafeInteger(value.revision))
    return { reason: "invalid-revision", success: false };
  if (value.status !== "applied" && value.status !== "rejected") {
    return { reason: "invalid-receipt-status", success: false };
  }
  if (value.reason !== undefined && !isBoundedText(value.reason)) {
    return { reason: "invalid-receipt-reason", success: false };
  }
  if (value.status === "rejected" && value.reason === undefined) {
    return { reason: "rejected-receipt-requires-reason", success: false };
  }
  if (value.status === "applied" && value.reason !== undefined) {
    return { reason: "applied-receipt-cannot-have-reason", success: false };
  }

  return { receipt: value as unknown as PlaybackHostControlReceipt, success: true };
}

export function validatePlaybackHostSessionSnapshot(
  value: unknown,
): PlaybackHostSessionSnapshotValidationResult {
  if (!isRecord(value)) return { reason: "snapshot-not-an-object", success: false };
  if (!hasOnlyKeys(value, ["type", "protocolVersion", "session"])) {
    return { reason: "snapshot-has-unknown-fields", success: false };
  }
  if (value.type !== "session-snapshot") return { reason: "invalid-snapshot-type", success: false };
  if (value.protocolVersion !== PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (!isPlaybackSessionSeed(value.session))
    return { reason: "invalid-session-seed", success: false };

  return { snapshot: value as unknown as PlaybackHostSessionSnapshot, success: true };
}

export function validatePlaybackHostControlPayload(
  value: unknown,
): PlaybackHostControlValidationResult {
  const command = validatePlaybackHostClientCommand(value);
  if (command.success) return { payload: command.command, success: true };

  const receipt = validatePlaybackHostControlReceipt(value);
  if (receipt.success) return { payload: receipt.receipt, success: true };

  const snapshot = validatePlaybackHostSessionSnapshot(value);
  if (snapshot.success) return { payload: snapshot.snapshot, success: true };

  return { reason: "invalid-playback-host-control-payload", success: false };
}

export function isPlaybackHostControlPayload(value: unknown): value is PlaybackHostControlPayload {
  return validatePlaybackHostControlPayload(value).success;
}
