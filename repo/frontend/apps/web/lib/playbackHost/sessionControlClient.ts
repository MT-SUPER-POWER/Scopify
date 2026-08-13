import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackHostControlReceipt,
  type PlaybackHostQueueCommand,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackHostSessionSnapshot,
} from "@scopify/desktop-contract/playbackHostControl";

import {
  createInitialPlaybackSessionRevision,
  nextPlaybackSessionRevision,
  toPlaybackSessionSeed,
  toPlayerSessionProjectionFromSnapshot,
} from "@/lib/playbackHost/sessionMapper";
import type {
  DesktopMainQueueCommand,
  DesktopMainQueueCommandReceipt,
} from "@/lib/playbackHost/desktopMainQueueCommandDispatcher";
import type {
  RuntimePlaybackHostControl,
  RuntimePlaybackHostControlClientPayload,
  RuntimePlaybackHostControlConnection,
  RuntimePlaybackHostControlHostPayload,
} from "@/lib/runtime";
import type { PlayerStore } from "@/types/player";

/** The durable Main Window fields that make up a complete Host session seed. */
export type PlaybackHostSessionControlClientPlayerState = Pick<
  PlayerStore,
  | "historyIndex"
  | "historyStack"
  | "isPlaying"
  | "isShuffle"
  | "musicQuality"
  | "originalQueue"
  | "playlistId"
  | "queue"
  | "queueIndex"
  | "repeatMode"
  | "volume"
>;

export type PlaybackHostSessionControlClientProjection = ReturnType<
  typeof toPlayerSessionProjectionFromSnapshot
>;

export interface PlaybackHostSessionControlClientOptions {
  /** Runtime-owned, client-only port factory. */
  control: RuntimePlaybackHostControl;
  connectionId: string;
  /** Reads the Main Window's durable queue and playback preferences. */
  readPlayerState(): PlaybackHostSessionControlClientPlayerState;
  /** The live media position already normalized to milliseconds. */
  readResumePositionMs(): number;
  /**
   * Applies a Host-authoritative snapshot to the Main Window. This callback is
   * deliberately synchronous so a Zustand subscription triggered by it can be
   * suppressed in the same call stack.
   */
  applySnapshot(
    snapshot: PlaybackHostSessionSnapshot,
    projection: PlaybackHostSessionControlClientProjection,
  ): void;
  /**
   * Called only when the active transport closes on its own. Consumers can use
   * this to schedule bounded Host-recovery reconnects. Explicit `close()` and
   * `connect()` replacement never call it.
   */
  onConnectionClosed?(): void;
  /**
   * Called when the broker accepts a client connection but cannot route a
   * complete session seed to a live Host. The connection remains valid, so
   * this must use the same recovery path as an unexpected port close.
   */
  onHostRecoveryRequired?(reason: PlaybackHostRecoveryReason): void;
  /** Prefixes generated idempotency keys without exposing their sequence. */
  commandIdPrefix?: string;
}

export interface PlaybackHostSessionControlClientDiagnostics {
  active: boolean;
  closed: boolean;
  currentRevision: number;
  lastSentFingerprint: string | null;
  pendingCommandCount: number;
}

interface PendingQueueCommand {
  receipt: PlaybackHostControlReceipt | null;
  resolve(receipt: DesktopMainQueueCommandReceipt): void;
}

type PlaybackHostRecoveryReason =
  "playback-host-disconnected" | "playback-host-replaced" | "playback-host-unavailable";

const DEFAULT_COMMAND_ID_PREFIX = "playback-host-session";

/**
 * Main Window application service for the low-rate Host session-control port.
 *
 * It owns only transport bookkeeping. Player state, wall-clock time, and the
 * concrete Zustand mutation remain injected so this service is deterministic
 * and safe to test without React or Electron.
 */
export class PlaybackHostSessionControlClient {
  private commandSequence = 0;
  private connection: RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlHostPayload> | null =
    null;
  private connectionGeneration = 0;
  private currentRevision = createInitialPlaybackSessionRevision();
  private latestSnapshotRevision = createInitialPlaybackSessionRevision();
  private closed = false;
  private isApplyingSnapshot = false;
  private lastSentFingerprint: string | null = null;
  private readonly pendingCommands = new Set<string>();
  private readonly pendingQueueCommands = new Map<string, PendingQueueCommand>();
  /**
   * A broker can reject while keeping the client port open. Hold durable
   * updates until the reconnect path has seeded the Host again; otherwise each
   * local store change would create another rejected command storm.
   */
  private isHostRecoveryPending = false;

  constructor(private readonly options: PlaybackHostSessionControlClientOptions) {
    if (!options.connectionId)
      throw new TypeError("Playback Host control connectionId is required.");
  }

  /**
   * Opens (or replaces) the client transport and sends a complete seed even if
   * the local state has not changed. This makes initial attachment and a port
   * reconnect converge through the same code path.
   */
  connect(): boolean {
    if (this.closed) return false;

    this.connectionGeneration += 1;
    const generation = this.connectionGeneration;
    this.connection?.close();
    this.connection = null;
    this.clearPendingQueueCommands("playback-host-control-connection-replaced");
    this.pendingCommands.clear();

    const connection = this.options.control.connectClient(
      this.options.connectionId,
      (payload) => this.handlePayload(generation, payload),
      () => this.handleClose(generation),
    );
    this.connection = connection;
    return this.publishCurrentSession({ force: true });
  }

  /**
   * Call from the Main Window's durable-player subscription. A Host snapshot
   * applied in that subscription's synchronous stack is intentionally ignored,
   * so Host state never bounces back as a fresh client command.
   */
  notifyPlayerStateChanged(): boolean {
    if (this.closed || this.isApplyingSnapshot || this.isHostRecoveryPending) return false;
    return this.publishCurrentSession({ force: false });
  }

  /**
   * Sends an intent-only queue operation to the Host. The returned promise is
   * deliberately held until the matching authoritative session snapshot has
   * arrived, so callers never treat a receipt as permission to mutate Main's
   * queue projection locally.
   */
  dispatchQueueCommand(command: DesktopMainQueueCommand): Promise<DesktopMainQueueCommandReceipt> {
    const connection = this.connection;
    if (this.closed || !connection || this.isHostRecoveryPending) {
      return Promise.resolve({
        reason: "playback-host-control-unavailable",
        status: "unavailable",
      });
    }

    const commandId = this.nextCommandId();
    const payload = {
      ...command,
      commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    } satisfies PlaybackHostQueueCommand;

    return new Promise((resolve) => {
      this.pendingQueueCommands.set(commandId, { receipt: null, resolve });
      if (connection.send(payload)) return;

      this.pendingQueueCommands.delete(commandId);
      resolve({ reason: "playback-host-control-send-failed", status: "unavailable" });
    });
  }

  /** Permanently stops this service. Late port callbacks become no-ops. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.connectionGeneration += 1;
    this.clearPendingQueueCommands("playback-host-control-closed");
    this.pendingCommands.clear();
    const connection = this.connection;
    this.connection = null;
    connection?.close();
  }

  getDiagnostics(): PlaybackHostSessionControlClientDiagnostics {
    return {
      active: this.connection !== null && !this.closed,
      closed: this.closed,
      currentRevision: this.currentRevision,
      lastSentFingerprint: this.lastSentFingerprint,
      pendingCommandCount: this.pendingCommands.size + this.pendingQueueCommands.size,
    };
  }

  private handlePayload(
    generation: number,
    payload: RuntimePlaybackHostControlClientPayload,
  ): void {
    if (this.closed || generation !== this.connectionGeneration) return;
    if (payload.type === "session-snapshot") {
      this.handleSnapshot(payload);
      return;
    }
    // The transport type is shared with the Host command surface, but a Main
    // client only accepts snapshots and receipts. Ignore an unexpected Host
    // command rather than treating it as a receipt at runtime.
    if (payload.type === "command-receipt") this.handleReceipt(payload);
  }

  private handleClose(generation: number): void {
    if (this.closed || generation !== this.connectionGeneration) return;
    this.connection = null;
    this.clearPendingQueueCommands("playback-host-control-closed");
    this.pendingCommands.clear();
    this.isHostRecoveryPending = true;
    this.options.onConnectionClosed?.();
  }

  private handleSnapshot(snapshot: PlaybackHostSessionSnapshot): void {
    this.currentRevision = Math.max(this.currentRevision, snapshot.session.revision);
    this.latestSnapshotRevision = Math.max(this.latestSnapshotRevision, snapshot.session.revision);
    this.lastSentFingerprint = fingerprintSession(snapshot.session);
    this.isHostRecoveryPending = false;

    this.isApplyingSnapshot = true;
    try {
      this.options.applySnapshot(snapshot, toPlayerSessionProjectionFromSnapshot(snapshot));
    } finally {
      this.isApplyingSnapshot = false;
    }
    this.resolveQueueCommandsThrough(snapshot.session.revision);
  }

  private handleReceipt(receipt: PlaybackHostControlReceipt): void {
    const pendingQueueCommand = this.pendingQueueCommands.get(receipt.commandId);
    if (pendingQueueCommand) {
      this.currentRevision = Math.max(this.currentRevision, receipt.revision);
      if (receipt.status === "rejected") {
        this.pendingQueueCommands.delete(receipt.commandId);
        pendingQueueCommand.resolve({
          reason: receipt.reason ?? "playback-host-queue-command-rejected",
          status: "rejected",
        });
        return;
      }

      pendingQueueCommand.receipt = receipt;
      this.resolveQueueCommandsThrough(this.latestSnapshotRevision);
      return;
    }

    if (!this.pendingCommands.has(receipt.commandId)) return;
    this.pendingCommands.delete(receipt.commandId);
    this.currentRevision = Math.max(this.currentRevision, receipt.revision);

    if (receipt.status === "applied") return;
    if (isPlaybackHostRecoveryReason(receipt.reason)) {
      this.isHostRecoveryPending = true;
      this.options.onHostRecoveryRequired?.(receipt.reason);
      return;
    }
    // A stale replacement is definitive proof that the Host changed while the
    // Main Window's copy was in flight. Reissuing that copied seed with a
    // larger revision would let an old UI projection overwrite a successful
    // Host-side next/previous transition. The next authoritative snapshot is
    // the only safe convergence point.
  }

  private publishCurrentSession({ force }: { force: boolean }): boolean {
    const connection = this.connection;
    if (this.closed || !connection) return false;

    let fingerprint: string;
    try {
      fingerprint = this.currentFingerprint();
    } catch {
      // An empty queue or invalid persisted values cannot produce a complete
      // session. Leave the Host untouched until the Main Window becomes valid.
      return false;
    }
    if (!force && fingerprint === this.lastSentFingerprint) return false;

    const revision = nextPlaybackSessionRevision(this.currentRevision);
    let session: PlaybackHostReplaceSessionCommand["session"];
    try {
      session = toPlaybackSessionSeed(
        this.options.readPlayerState(),
        this.options.readResumePositionMs(),
        revision,
      );
    } catch {
      return false;
    }

    const command: PlaybackHostReplaceSessionCommand = {
      commandId: this.nextCommandId(),
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      session,
      type: "replace-session",
    };
    if (!connection.send(command)) return false;

    this.currentRevision = revision;
    this.lastSentFingerprint = fingerprint;
    this.pendingCommands.add(command.commandId);
    return true;
  }

  private currentFingerprint(): string {
    const session = toPlaybackSessionSeed(
      this.options.readPlayerState(),
      this.options.readResumePositionMs(),
      createInitialPlaybackSessionRevision(),
    );
    return fingerprintSession(session);
  }

  private nextCommandId(): string {
    this.commandSequence += 1;
    return `${this.options.commandIdPrefix ?? DEFAULT_COMMAND_ID_PREFIX}-${this.commandSequence}`;
  }

  private clearPendingQueueCommands(reason: string): void {
    for (const pending of this.pendingQueueCommands.values()) {
      pending.resolve({ reason, status: "unavailable" });
    }
    this.pendingQueueCommands.clear();
  }

  private resolveQueueCommandsThrough(revision: number): void {
    for (const [commandId, pending] of this.pendingQueueCommands) {
      const receipt = pending.receipt;
      if (!receipt || receipt.revision > revision) continue;
      this.pendingQueueCommands.delete(commandId);
      pending.resolve({ status: "applied" });
    }
  }
}

function isPlaybackHostRecoveryReason(
  reason: string | undefined,
): reason is PlaybackHostRecoveryReason {
  return (
    reason === "playback-host-unavailable" ||
    reason === "playback-host-disconnected" ||
    reason === "playback-host-replaced"
  );
}

export function createPlaybackHostSessionControlClient(
  options: PlaybackHostSessionControlClientOptions,
): PlaybackHostSessionControlClient {
  return new PlaybackHostSessionControlClient(options);
}

function fingerprintSession(session: PlaybackHostReplaceSessionCommand["session"]): string {
  // The DTO has a fixed construction order in the mapper. Normalising revision
  // keeps the fingerprint about user-visible state rather than wire sequencing.
  return JSON.stringify({ ...session, revision: createInitialPlaybackSessionRevision() });
}
