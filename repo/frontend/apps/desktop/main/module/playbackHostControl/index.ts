import type {
  PlaybackHostClientCommand,
  PlaybackHostControlReceipt,
  PlaybackHostReplaceSessionCommand,
  PlaybackHostSessionSnapshot,
} from "@scopifymusicplayer/desktop-contract";
import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  validatePlaybackHostClientCommand,
  validatePlaybackHostControlPayload,
} from "@scopifymusicplayer/desktop-contract";
import {
  PLAYBACK_CHECKPOINT_PROTOCOL_VERSION,
  type PlaybackCheckpoint,
} from "@scopifymusicplayer/desktop-contract/playbackCheckpoint";

import type { PlaybackHostCheckpointRepository } from "../playbackHost/checkpoint.js";

import type { PlaybackHostControlPort } from "./port.js";

export type { PlaybackHostControlPort } from "./port.js";
export {
  createOwnedPlaybackHostControlConnectionId,
  parsePlaybackHostControlConnectionRequest,
} from "./connectionRequest.js";

const MAXIMUM_REMEMBERED_COMMAND_IDS = 2_048;
const MAXIMUM_PENDING_COMMANDS = 256;
const RECOVERY_COMMAND_PREFIX = "checkpoint-recovery:";

export type PlaybackHostControlBrokerRejectionReason =
  | "duplicate-command-id"
  | "inactive-client"
  | "inactive-host"
  | "invalid-client-payload"
  | "invalid-host-payload"
  | "receipt-client-replaced"
  | "uncloneable-payload"
  | "unexpected-client-payload"
  | "unexpected-host-payload"
  | "unknown-command-receipt";

export interface PlaybackHostControlBrokerRejection {
  connectionId: string;
  messageType?: string;
  reason: PlaybackHostControlBrokerRejectionReason;
  source: "client" | "host";
}

export interface PlaybackHostControlBrokerDiagnostics {
  activeClientConnectionId: string | null;
  activeHostConnectionId: string | null;
  cachedSnapshotRevision: number | null;
  checkpointClearAttempts: number;
  checkpointLoadAttempts: number;
  checkpointPersistenceFailures: number;
  checkpointSaveAttempts: number;
  clientDisconnects: number;
  clientReplacements: number;
  commandReceiptsRouted: number;
  commandsForwarded: number;
  disposed: boolean;
  hostDisconnects: number;
  hostReplacements: number;
  lastRejection: PlaybackHostControlBrokerRejection | null;
  pendingCommandCount: number;
  rejectedCommands: number;
  recoveryCommandsForwarded: number;
  recoverySkips: number;
  snapshotsReplayed: number;
  snapshotsRouted: number;
}

export interface PlaybackHostControlBroker {
  dispose(): void;
  getDiagnostics(): PlaybackHostControlBrokerDiagnostics;
  registerClient(clientId: string, port: PlaybackHostControlPort): () => void;
  /**
   * `onRecoverySettled` runs only after this Host's checkpoint decision has
   * completed. A recovered checkpoint must also acknowledge before the Host
   * becomes control-ready, so Main cannot race an old restore with live state.
   */
  registerHost(
    hostId: string,
    port: PlaybackHostControlPort,
    onRecoverySettled?: () => void,
  ): () => void;
}

export interface PlaybackHostControlBrokerClock {
  nowMs(): number;
}

export interface PlaybackHostControlBrokerOptions {
  checkpointRepository?: PlaybackHostCheckpointRepository;
  clock?: PlaybackHostControlBrokerClock;
}

interface PortConnection {
  closed: boolean;
  id: string;
  port: PlaybackHostControlPort;
  unsubscribeClose: () => void;
  unsubscribeMessage: () => void;
}

interface PendingCommand {
  client: PortConnection | null;
  kind: "client" | "recovery";
  revision: number;
}

interface BufferedLiveCommand {
  client: PortConnection;
  command: PlaybackHostClientCommand;
}

interface RecoveryBarrier {
  cancelledByLiveCommand: boolean;
  connection: PortConnection;
  generation: number;
  liveCommands: BufferedLiveCommand[];
  onSettled?: () => void;
  recoveryCommandId: string | null;
  state: "loading" | "recovering" | "settled";
}

type ClientDisconnectReason = "disconnected" | "disposed" | "replaced" | "transport-error";
type HostDisconnectReason = "disconnected" | "disposed" | "replaced" | "transport-error";

/**
 * Reliable, low-rate, one-client/one-host session-control router. It neither
 * elects a playback authority nor queues work for a missing host: callers get
 * a contract-valid rejected receipt immediately when no Host is attached.
 */
export function createPlaybackHostControlBroker(
  options: PlaybackHostControlBrokerOptions = {},
): PlaybackHostControlBroker {
  const checkpointRepository = options.checkpointRepository;
  const clock = options.clock ?? { nowMs: () => Date.now() };
  let client: PortConnection | null = null;
  let host: PortConnection | null = null;
  let hostGeneration = 0;
  let latestSnapshot: PlaybackHostSessionSnapshot | null = null;
  let recoveryBarrier: RecoveryBarrier | null = null;
  let disposed = false;
  let lastRejection: PlaybackHostControlBrokerRejection | null = null;

  const pendingCommands = new Map<string, PendingCommand>();
  const rememberedCommandIds = new Set<string>();
  const rememberedCommandOrder: string[] = [];
  const counters = {
    checkpointClearAttempts: 0,
    checkpointLoadAttempts: 0,
    checkpointPersistenceFailures: 0,
    checkpointSaveAttempts: 0,
    clientDisconnects: 0,
    clientReplacements: 0,
    commandReceiptsRouted: 0,
    commandsForwarded: 0,
    hostDisconnects: 0,
    hostReplacements: 0,
    rejectedCommands: 0,
    recoveryCommandsForwarded: 0,
    recoverySkips: 0,
    snapshotsReplayed: 0,
    snapshotsRouted: 0,
  };
  let checkpointSaveTail: Promise<void> = Promise.resolve();
  let recoveryCommandSequence = 0;

  function registerClient(clientId: string, port: PlaybackHostControlPort) {
    requireConnectionId(clientId, "client");
    requireActiveBroker();
    if (client) disconnectClient(client, "replaced", true);

    const connection = createConnection(clientId, port);
    client = connection;
    try {
      attachConnection(
        connection,
        (message) => handleClientMessage(connection, message),
        () => disconnectClient(connection, "disconnected", false),
      );
      replayLatestSnapshot(connection);
    } catch (error) {
      if (client === connection) client = null;
      closeConnection(connection, true);
      throw error;
    }
    return once(() => disconnectClient(connection, "disconnected", true));
  }

  function registerHost(
    hostId: string,
    port: PlaybackHostControlPort,
    onRecoverySettled?: () => void,
  ) {
    requireConnectionId(hostId, "host");
    requireActiveBroker();
    if (host) disconnectHost(host, "replaced", true);

    const connection = createConnection(hostId, port);
    host = connection;
    const connectionGeneration = ++hostGeneration;
    const barrier: RecoveryBarrier = {
      cancelledByLiveCommand: false,
      connection,
      generation: connectionGeneration,
      liveCommands: [],
      onSettled: onRecoverySettled,
      recoveryCommandId: null,
      state: "loading",
    };
    recoveryBarrier = barrier;
    try {
      attachConnection(
        connection,
        (message) => handleHostMessage(connection, message),
        () => disconnectHost(connection, "disconnected", false),
      );
      if (checkpointRepository) void recoverCheckpoint(barrier);
      else settleRecoveryBarrier(barrier);
    } catch (error) {
      if (host === connection) host = null;
      if (recoveryBarrier === barrier) recoveryBarrier = null;
      closeConnection(connection, true);
      throw error;
    }
    return once(() => disconnectHost(connection, "disconnected", true));
  }

  function handleClientMessage(connection: PortConnection, value: unknown) {
    if (client !== connection) {
      reject(connection, "client", "inactive-client", value);
      return;
    }

    const validation = validatePlaybackHostClientCommand(value);
    if (!validation.success) {
      reject(connection, "client", "invalid-client-payload", value);
      return;
    }
    forwardCommand(connection, validation.command);
  }

  function forwardCommand(connection: PortConnection, command: PlaybackHostClientCommand) {
    const revision = commandRevision(command, latestSnapshot?.session.revision ?? 0);
    if (pendingCommands.has(command.commandId) || !rememberCommandId(command.commandId)) {
      reject(connection, "client", "duplicate-command-id", command);
      postRejectedReceipt(connection, command.commandId, revision, "duplicate-command-id");
      return;
    }
    if (pendingCommandCount() >= MAXIMUM_PENDING_COMMANDS) {
      postRejectedReceipt(
        connection,
        command.commandId,
        revision,
        "playback-host-command-capacity-exhausted",
      );
      return;
    }
    if (!host) {
      postRejectedReceipt(connection, command.commandId, revision, "playback-host-unavailable");
      return;
    }

    const forwarded = clonePayload(connection, "client", command);
    if (!forwarded) return;
    const barrier = recoveryBarrier;
    if (barrier && barrier.connection === host && barrier.state !== "settled") {
      if (barrier.state === "loading") barrier.cancelledByLiveCommand = true;
      barrier.liveCommands.push({ client: connection, command: forwarded });
      return;
    }
    forwardAcceptedLiveCommand(connection, forwarded);
  }

  function forwardAcceptedLiveCommand(
    connection: PortConnection,
    command: PlaybackHostClientCommand,
  ) {
    const revision = commandRevision(command, latestSnapshot?.session.revision ?? 0);
    if (client !== connection || !host) {
      if (client === connection) {
        postRejectedReceipt(connection, command.commandId, revision, "playback-host-unavailable");
      }
      return;
    }
    pendingCommands.set(command.commandId, {
      client: connection,
      kind: "client",
      revision,
    });
    if (postToConnection(host, command)) {
      counters.commandsForwarded += 1;
      return;
    }
    disconnectHost(host, "transport-error", true);
  }

  function handleHostMessage(connection: PortConnection, value: unknown) {
    if (host !== connection) {
      reject(connection, "host", "inactive-host", value);
      return;
    }

    const validation = validatePlaybackHostControlPayload(value);
    if (!validation.success) {
      reject(connection, "host", "invalid-host-payload", value);
      return;
    }
    if (validation.payload.type === "replace-session") {
      reject(connection, "host", "unexpected-host-payload", validation.payload);
      return;
    }
    if (validation.payload.type === "session-snapshot") {
      forwardSnapshot(connection, validation.payload);
      return;
    }
    if (validation.payload.type !== "command-receipt") {
      reject(connection, "host", "unexpected-host-payload", validation.payload);
      return;
    }
    routeReceipt(connection, validation.payload);
  }

  function forwardSnapshot(connection: PortConnection, snapshot: PlaybackHostSessionSnapshot) {
    const forwarded = clonePayload(connection, "host", snapshot);
    if (!forwarded) return;
    latestSnapshot = forwarded;
    scheduleCheckpointPersistence(forwarded);
    if (!client) return;
    if (postToConnection(client, forwarded)) {
      counters.snapshotsRouted += 1;
      return;
    }
    disconnectClient(client, "transport-error", true);
  }

  function routeReceipt(connection: PortConnection, receipt: PlaybackHostControlReceipt) {
    const pending = pendingCommands.get(receipt.commandId);
    if (!pending) {
      reject(connection, "host", "unknown-command-receipt", receipt);
      return;
    }
    pendingCommands.delete(receipt.commandId);
    if (pending.kind === "recovery") {
      settleRecoveredCheckpoint(connection, receipt.commandId);
      return;
    }
    if (!pending.client) return;
    if (client !== pending.client) {
      reject(connection, "host", "receipt-client-replaced", receipt);
      return;
    }

    const forwarded = clonePayload(connection, "host", receipt);
    if (!forwarded) return;
    if (postToConnection(pending.client, forwarded)) {
      counters.commandReceiptsRouted += 1;
      return;
    }
    disconnectClient(pending.client, "transport-error", true);
  }

  function replayLatestSnapshot(connection: PortConnection) {
    if (!latestSnapshot) return;
    const replay = clonePayload(connection, "client", latestSnapshot);
    if (!replay) return;
    if (!postToConnection(connection, replay)) {
      throw new Error("Failed to replay the Playback Host session snapshot.");
    }
    counters.snapshotsReplayed += 1;
  }

  function disconnectClient(
    connection: PortConnection,
    reason: ClientDisconnectReason,
    closePort: boolean,
  ) {
    if (client !== connection) {
      closeConnection(connection, closePort);
      return;
    }
    client = null;
    closeConnection(connection, closePort);
    clearPendingCommandsForClient(connection);
    clearBufferedCommandsForClient(connection);
    if (reason === "replaced") counters.clientReplacements += 1;
    else counters.clientDisconnects += 1;
  }

  function disconnectHost(
    connection: PortConnection,
    reason: HostDisconnectReason,
    closePort: boolean,
  ) {
    if (host !== connection) {
      closeConnection(connection, closePort);
      return;
    }
    host = null;
    hostGeneration += 1;
    latestSnapshot = null;
    const barrier = recoveryBarrier;
    if (barrier?.connection === connection) {
      recoveryBarrier = null;
      failBufferedLiveCommands(barrier, hostFailureReason(reason));
    }
    closeConnection(connection, closePort);
    if (reason === "replaced") counters.hostReplacements += 1;
    else counters.hostDisconnects += 1;
    failPendingCommands(hostFailureReason(reason));
  }

  function failPendingCommands(reason: string) {
    for (const [commandId, pending] of [...pendingCommands]) {
      pendingCommands.delete(commandId);
      if (pending.kind !== "client" || client !== pending.client || !pending.client) continue;
      postRejectedReceipt(pending.client, commandId, pending.revision, reason);
    }
  }

  function clearPendingCommandsForClient(connection: PortConnection) {
    for (const [commandId, pending] of pendingCommands) {
      if (pending.kind === "client" && pending.client === connection)
        pendingCommands.delete(commandId);
    }
  }

  function clearBufferedCommandsForClient(connection: PortConnection) {
    const barrier = recoveryBarrier;
    if (!barrier) return;
    barrier.liveCommands = barrier.liveCommands.filter((pending) => pending.client !== connection);
  }

  function failBufferedLiveCommands(barrier: RecoveryBarrier, reason: string) {
    for (const pending of barrier.liveCommands.splice(0)) {
      if (client !== pending.client) continue;
      postRejectedReceipt(
        pending.client,
        pending.command.commandId,
        commandRevision(pending.command, latestSnapshot?.session.revision ?? 0),
        reason,
      );
    }
  }

  async function recoverCheckpoint(barrier: RecoveryBarrier) {
    const { connection, generation } = barrier;
    if (!checkpointRepository) {
      settleRecoveryBarrier(barrier);
      return;
    }
    counters.checkpointLoadAttempts += 1;
    let checkpoint: PlaybackCheckpoint | null;
    try {
      checkpoint = await checkpointRepository.load();
    } catch {
      counters.checkpointPersistenceFailures += 1;
      settleRecoveryBarrier(barrier);
      return;
    }
    if (!isActiveRecoveryBarrier(barrier)) return;
    if (!checkpoint) {
      settleRecoveryBarrier(barrier);
      return;
    }
    if (barrier.cancelledByLiveCommand) {
      counters.recoverySkips += 1;
      settleRecoveryBarrier(barrier);
      return;
    }

    const commandId = `${RECOVERY_COMMAND_PREFIX}${generation}:${++recoveryCommandSequence}`;
    const command: PlaybackHostReplaceSessionCommand = {
      commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      session: structuredClone(checkpoint.session),
      type: "replace-session",
    };
    barrier.recoveryCommandId = commandId;
    barrier.state = "recovering";
    pendingCommands.set(commandId, {
      client: null,
      kind: "recovery",
      revision: command.session.revision,
    });
    const forwarded = clonePayload(connection, "host", command);
    if (!forwarded || !isActiveRecoveryBarrier(barrier)) {
      pendingCommands.delete(commandId);
      return;
    }
    if (postToConnection(connection, forwarded)) {
      counters.recoveryCommandsForwarded += 1;
      return;
    }
    pendingCommands.delete(commandId);
    disconnectHost(connection, "transport-error", true);
  }

  function settleRecoveredCheckpoint(connection: PortConnection, commandId: string) {
    const barrier = recoveryBarrier;
    if (
      !barrier ||
      barrier.connection !== connection ||
      barrier.state !== "recovering" ||
      barrier.recoveryCommandId !== commandId
    ) {
      return;
    }
    settleRecoveryBarrier(barrier);
  }

  function settleRecoveryBarrier(barrier: RecoveryBarrier) {
    if (!isActiveRecoveryBarrier(barrier) || barrier.state === "settled") return;
    barrier.state = "settled";
    flushBufferedLiveCommands(barrier);
    barrier.onSettled?.();
  }

  function flushBufferedLiveCommands(barrier: RecoveryBarrier) {
    for (const pending of barrier.liveCommands.splice(0)) {
      forwardAcceptedLiveCommand(pending.client, pending.command);
    }
  }

  function isActiveRecoveryBarrier(barrier: RecoveryBarrier) {
    return (
      !disposed &&
      recoveryBarrier === barrier &&
      host === barrier.connection &&
      hostGeneration === barrier.generation
    );
  }

  function hostFailureReason(reason: HostDisconnectReason) {
    return reason === "replaced"
      ? "playback-host-replaced"
      : reason === "disposed"
        ? "playback-host-control-disposed"
        : "playback-host-disconnected";
  }

  function scheduleCheckpointPersistence(snapshot: PlaybackHostSessionSnapshot) {
    if (!checkpointRepository) return;
    const session = structuredClone(snapshot.session);
    checkpointSaveTail = checkpointSaveTail
      .catch(() => undefined)
      .then(async () => {
        try {
          if (session.queue.queue.length === 0) {
            counters.checkpointClearAttempts += 1;
            if (!(await checkpointRepository.clear())) counters.checkpointPersistenceFailures += 1;
            return;
          }
          const savedAtMs = toSafeCheckpointTimestamp(clock.nowMs());
          if (savedAtMs === null) {
            counters.checkpointPersistenceFailures += 1;
            return;
          }
          counters.checkpointSaveAttempts += 1;
          if (
            !(await checkpointRepository.save({
              protocolVersion: PLAYBACK_CHECKPOINT_PROTOCOL_VERSION,
              savedAtMs,
              session,
            } satisfies PlaybackCheckpoint))
          ) {
            counters.checkpointPersistenceFailures += 1;
          }
        } catch {
          counters.checkpointPersistenceFailures += 1;
        }
      });
  }

  function postRejectedReceipt(
    connection: PortConnection,
    commandId: string,
    revision: number,
    reason: string,
  ) {
    const receipt: PlaybackHostControlReceipt = {
      commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      reason,
      revision,
      status: "rejected",
      type: "command-receipt",
    };
    counters.rejectedCommands += 1;
    if (!postToConnection(connection, receipt)) {
      disconnectClient(connection, "transport-error", true);
    }
  }

  function rememberCommandId(commandId: string) {
    if (rememberedCommandIds.has(commandId)) return false;
    rememberedCommandIds.add(commandId);
    rememberedCommandOrder.push(commandId);
    if (rememberedCommandOrder.length > MAXIMUM_REMEMBERED_COMMAND_IDS) {
      const forgotten = rememberedCommandOrder.shift();
      if (forgotten !== undefined) rememberedCommandIds.delete(forgotten);
    }
    return true;
  }

  function clonePayload<T>(
    connection: PortConnection,
    source: "client" | "host",
    payload: T,
  ): T | null {
    try {
      return structuredClone(payload);
    } catch {
      reject(connection, source, "uncloneable-payload", payload);
      return null;
    }
  }

  function reject(
    connection: PortConnection,
    source: "client" | "host",
    reason: PlaybackHostControlBrokerRejectionReason,
    value: unknown,
  ) {
    lastRejection = {
      connectionId: connection.id,
      reason,
      source,
      ...describePayload(value),
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (host) disconnectHost(host, "disposed", true);
    if (client) disconnectClient(client, "disposed", true);
  }

  function getDiagnostics(): PlaybackHostControlBrokerDiagnostics {
    return {
      ...counters,
      activeClientConnectionId: client?.id ?? null,
      activeHostConnectionId: host?.id ?? null,
      cachedSnapshotRevision: latestSnapshot?.session.revision ?? null,
      disposed,
      lastRejection: lastRejection ? { ...lastRejection } : null,
      pendingCommandCount: pendingCommandCount(),
    };
  }

  function requireActiveBroker() {
    if (disposed) throw new Error("The Playback Host control broker is disposed.");
  }

  function pendingCommandCount() {
    return pendingCommands.size + (recoveryBarrier?.liveCommands.length ?? 0);
  }

  return { dispose, getDiagnostics, registerClient, registerHost };
}

function createConnection(id: string, port: PlaybackHostControlPort): PortConnection {
  return {
    closed: false,
    id,
    port,
    unsubscribeClose: () => {},
    unsubscribeMessage: () => {},
  };
}

function attachConnection(
  connection: PortConnection,
  onMessage: (message: unknown) => void,
  onClose: () => void,
) {
  connection.unsubscribeMessage = connection.port.onMessage(onMessage);
  connection.unsubscribeClose = connection.port.onClose(onClose);
}

function closeConnection(connection: PortConnection, closePort: boolean) {
  if (connection.closed) return;
  connection.closed = true;
  try {
    connection.unsubscribeMessage();
  } catch {
    // Listener teardown is isolated to this transport.
  }
  try {
    connection.unsubscribeClose();
  } catch {
    // Listener teardown is isolated to this transport.
  }
  if (!closePort) return;
  try {
    connection.port.close();
  } catch {
    // The port is already detached; closing failures cannot affect peers.
  }
}

function postToConnection(connection: PortConnection, value: unknown): boolean {
  if (connection.closed) return false;
  try {
    connection.port.postMessage(value);
    return true;
  } catch {
    return false;
  }
}

function requireConnectionId(id: string, role: "client" | "host") {
  if (typeof id !== "string" || id.length === 0 || id.length > 128) {
    throw new RangeError(
      `${role} connection ID must be a non-empty string of at most 128 characters.`,
    );
  }
}

function toSafeCheckpointTimestamp(value: number): number | null {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * Queue commands intentionally carry no predicted session revision. When the
 * broker itself must reject one before the Host replies, the latest canonical
 * snapshot is the only truthful revision it can report; zero is the contract
 * baseline before the Host has emitted a snapshot.
 */
function commandRevision(command: PlaybackHostClientCommand, latestRevision = 0): number {
  return command.type === "replace-session" ? command.session.revision : latestRevision;
}

function describePayload(value: unknown): Pick<PlaybackHostControlBrokerRejection, "messageType"> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const type = (value as Record<string, unknown>).type;
  return typeof type === "string" ? { messageType: type } : {};
}

function once(callback: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    callback();
  };
}
