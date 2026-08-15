import type {
  PlaybackBootstrapRequest,
  PlaybackBootstrap,
  PlaybackCommandReceipt,
  PlaybackMessage,
} from "@scopify/desktop-contract";
import {
  isPlaybackCommand,
  isPlaybackCommandReceipt,
  validatePlaybackMessage,
} from "@scopify/desktop-contract";

import type { PlaybackBrokerPort } from "./port.js";

const MAXIMUM_REMEMBERED_COMMAND_IDS = 2_048;
const DEFAULT_COMMAND_RECEIPT_TIMEOUT_MS = 20_000;
const MAXIMUM_COMMAND_RECEIPT_TIMEOUT_MS = 60_000;

export type PlaybackBrokerRejectionReason =
  | "authority-id-mismatch"
  | "bootstrap-required"
  | "duplicate-command-id"
  | "inactive-authority"
  | "inactive-replica"
  | "invalid-authority-payload"
  | "invalid-command"
  | "session-bootstrap-required"
  | "stale-sequence"
  | "uncloneable-message"
  | "unknown-command-receipt";

export interface PlaybackBrokerRejection {
  connectionId: string;
  messageType?: string;
  reason: PlaybackBrokerRejectionReason;
  sequence?: number;
  source: "authority" | "replica";
  validationReason?: string;
}

export interface PlaybackBrokerDiagnostics {
  acceptedMessages: number;
  activeAuthorityId: string | null;
  activeSessionId: string | null;
  authorityConnectionId: string | null;
  authorityDisconnects: number;
  authorityReplacements: number;
  bootstrapReplays: number;
  bootstrapSequence: number | null;
  commandReceiptsRouted: number;
  commandsForwarded: number;
  disposed: boolean;
  lastRejection: PlaybackBrokerRejection | null;
  lastSequence: number | null;
  messageDeliveries: number;
  pendingCommandCount: number;
  rejectionCounts: Readonly<Record<PlaybackBrokerRejectionReason, number>>;
  replicaCount: number;
  replicaDisconnects: number;
  replicaIds: string[];
  replicaReplacements: number;
}

export interface PlaybackBroker {
  dispose(): void;
  getDiagnostics(): PlaybackBrokerDiagnostics;
  registerAuthority(authorityId: string, port: PlaybackBrokerPort): () => void;
  registerReplica(replicaId: string, port: PlaybackBrokerPort): () => void;
}

export interface PlaybackBrokerOptions {
  commandReceiptTimeoutMs?: number;
}

interface PortConnection {
  closed: boolean;
  id: string;
  port: PlaybackBrokerPort;
  unsubscribeClose: () => void;
  unsubscribeMessage: () => void;
}

interface PendingCommand {
  replica: PortConnection;
  timeout: ReturnType<typeof setTimeout>;
}

type AuthorityDisconnectReason = "disposed" | "disconnected" | "replaced" | "transport-error";
type ReplicaDisconnectReason = "disposed" | "disconnected" | "replaced" | "transport-error";

export function createPlaybackBroker<TLyrics = unknown>(
  options: PlaybackBrokerOptions = {},
): PlaybackBroker {
  const commandReceiptTimeoutMs =
    options.commandReceiptTimeoutMs ?? DEFAULT_COMMAND_RECEIPT_TIMEOUT_MS;
  if (
    !Number.isFinite(commandReceiptTimeoutMs) ||
    commandReceiptTimeoutMs <= 0 ||
    commandReceiptTimeoutMs > MAXIMUM_COMMAND_RECEIPT_TIMEOUT_MS
  ) {
    throw new RangeError(
      `commandReceiptTimeoutMs must be between 1 and ${MAXIMUM_COMMAND_RECEIPT_TIMEOUT_MS}`,
    );
  }

  let authority: PortConnection | null = null;
  let activeAuthorityId: string | null = null;
  let activeSessionId: string | null = null;
  let bootstrap: PlaybackBootstrap<TLyrics> | null = null;
  let bootstrapRequested = false;
  let disposed = false;
  let lastSequence: number | null = null;
  let lastRejection: PlaybackBrokerRejection | null = null;

  const replicas = new Map<string, PortConnection>();
  const pendingCommands = new Map<string, PendingCommand>();
  const rememberedCommandIds = new Set<string>();
  const rememberedCommandOrder: string[] = [];
  const rejectionCounts = createRejectionCounts();

  const counters = {
    acceptedMessages: 0,
    authorityDisconnects: 0,
    authorityReplacements: 0,
    bootstrapReplays: 0,
    commandReceiptsRouted: 0,
    commandsForwarded: 0,
    messageDeliveries: 0,
    replicaDisconnects: 0,
    replicaReplacements: 0,
  };

  function registerAuthority(authorityId: string, port: PlaybackBrokerPort) {
    requireConnectionId(authorityId, "authority");
    requireActiveBroker();

    if (authority) disconnectAuthority(authority, "replaced", true);

    const connection = createConnection(authorityId, port);
    authority = connection;
    try {
      attachConnection(
        connection,
        (message) => handleAuthorityMessage(connection, message),
        () => disconnectAuthority(connection, "disconnected", false),
      );
    } catch (error) {
      authority = null;
      closeConnection(connection, true);
      throw error;
    }

    return once(() => disconnectAuthority(connection, "disconnected", true));
  }

  function registerReplica(replicaId: string, port: PlaybackBrokerPort) {
    requireConnectionId(replicaId, "replica");
    requireActiveBroker();

    const current = replicas.get(replicaId);
    if (current) disconnectReplica(current, "replaced", true);

    const connection = createConnection(replicaId, port);
    replicas.set(replicaId, connection);
    try {
      attachConnection(
        connection,
        (message) => handleReplicaMessage(connection, message),
        () => disconnectReplica(connection, "disconnected", false),
      );
      replayBootstrap(connection);
    } catch (error) {
      disconnectReplica(connection, "transport-error", true);
      throw error;
    }

    return once(() => disconnectReplica(connection, "disconnected", true));
  }

  function handleAuthorityMessage(connection: PortConnection, value: unknown) {
    if (authority !== connection) {
      reject(connection, "authority", "inactive-authority", value);
      return;
    }

    const validation = validatePlaybackMessage<TLyrics>(value);
    if (validation.success) {
      handleReliableMessage(connection, validation.message);
      return;
    }

    if (isPlaybackCommandReceipt(value)) {
      handleCommandReceipt(connection, value);
      return;
    }

    reject(connection, "authority", "invalid-authority-payload", value, validation.reason);
  }

  function handleReliableMessage(connection: PortConnection, message: PlaybackMessage<TLyrics>) {
    if (activeAuthorityId !== null && message.authorityId !== activeAuthorityId) {
      reject(connection, "authority", "authority-id-mismatch", message);
      return;
    }
    if (lastSequence !== null && message.sequence <= lastSequence) {
      reject(connection, "authority", "stale-sequence", message);
      return;
    }
    if (!bootstrap && message.type !== "bootstrap") {
      reject(connection, "authority", "bootstrap-required", message);
      requestBootstrap();
      return;
    }
    if (
      activeSessionId !== null &&
      message.sessionId !== activeSessionId &&
      message.type !== "bootstrap"
    ) {
      reject(connection, "authority", "session-bootstrap-required", message);
      return;
    }

    let acceptedMessage: PlaybackMessage<TLyrics>;
    try {
      acceptedMessage = structuredClone(message);
    } catch {
      reject(connection, "authority", "uncloneable-message", message);
      return;
    }

    lastSequence = acceptedMessage.sequence;
    counters.acceptedMessages += 1;
    if (acceptedMessage.type === "bootstrap") {
      bootstrapRequested = false;
      activeAuthorityId = acceptedMessage.authorityId;
      activeSessionId = acceptedMessage.sessionId;
      bootstrap = acceptedMessage;
    } else if (bootstrap) {
      bootstrap = synthesizeBootstrap(bootstrap, acceptedMessage);
    }

    for (const replica of [...replicas.values()]) {
      if (postToConnection(replica, acceptedMessage)) {
        counters.messageDeliveries += 1;
      } else {
        disconnectReplica(replica, "transport-error", true);
      }
    }
  }

  function handleCommandReceipt(connection: PortConnection, receipt: PlaybackCommandReceipt) {
    const pending = takePendingCommand(receipt.commandId);
    if (!pending) {
      reject(connection, "authority", "unknown-command-receipt", receipt);
      return;
    }
    if (replicas.get(pending.replica.id) !== pending.replica) return;

    if (postToConnection(pending.replica, receipt)) {
      counters.commandReceiptsRouted += 1;
    } else {
      disconnectReplica(pending.replica, "transport-error", true);
    }
  }

  function handleReplicaMessage(connection: PortConnection, value: unknown) {
    if (replicas.get(connection.id) !== connection) {
      reject(connection, "replica", "inactive-replica", value);
      return;
    }
    if (!isPlaybackCommand(value)) {
      reject(connection, "replica", "invalid-command", value);
      return;
    }
    if (pendingCommands.has(value.commandId)) {
      reject(connection, "replica", "duplicate-command-id", value);
      postToConnection(connection, {
        commandId: value.commandId,
        reason: "duplicate-command-id",
        status: "rejected",
      } satisfies PlaybackCommandReceipt);
      return;
    }
    if (!rememberCommandId(value.commandId)) {
      reject(connection, "replica", "duplicate-command-id", value);
      postToConnection(connection, {
        commandId: value.commandId,
        reason: "duplicate-command-id",
        status: "rejected",
      } satisfies PlaybackCommandReceipt);
      return;
    }
    if (!authority) {
      postUnavailable(connection, value.commandId, "playback-authority-unavailable");
      return;
    }

    const timeout = setTimeout(() => {
      const pending = takePendingCommand(value.commandId);
      if (!pending || replicas.get(pending.replica.id) !== pending.replica) return;
      postUnavailable(pending.replica, value.commandId, "command-receipt-timeout");
    }, commandReceiptTimeoutMs);
    if (typeof timeout === "object" && timeout && "unref" in timeout) {
      (timeout as { unref(): void }).unref();
    }
    pendingCommands.set(value.commandId, { replica: connection, timeout });
    if (postToConnection(authority, value)) {
      counters.commandsForwarded += 1;
      return;
    }

    disconnectAuthority(authority, "transport-error", true);
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

  function replayBootstrap(connection: PortConnection) {
    if (!bootstrap) {
      requestBootstrap();
      return;
    }
    let replay: PlaybackBootstrap<TLyrics>;
    try {
      replay = structuredClone(bootstrap);
    } catch {
      bootstrap = null;
      requestBootstrap();
      return;
    }
    if (!postToConnection(connection, replay)) {
      throw new Error("Failed to replay playback bootstrap to the replica.");
    }
    counters.bootstrapReplays += 1;
  }

  function disconnectAuthority(
    connection: PortConnection,
    reason: AuthorityDisconnectReason,
    closePort: boolean,
  ) {
    if (authority !== connection) {
      closeConnection(connection, closePort);
      return;
    }

    authority = null;
    activeAuthorityId = null;
    activeSessionId = null;
    bootstrap = null;
    bootstrapRequested = false;
    lastSequence = null;
    closeConnection(connection, closePort);

    if (reason === "replaced") counters.authorityReplacements += 1;
    else counters.authorityDisconnects += 1;

    failPendingCommands(
      reason === "replaced"
        ? "playback-authority-replaced"
        : reason === "disposed"
          ? "playback-broker-disposed"
          : "playback-authority-disconnected",
    );
  }

  function disconnectReplica(
    connection: PortConnection,
    reason: ReplicaDisconnectReason,
    closePort: boolean,
  ) {
    if (replicas.get(connection.id) !== connection) {
      closeConnection(connection, closePort);
      return;
    }

    replicas.delete(connection.id);
    closeConnection(connection, closePort);
    clearPendingCommandsForReplica(connection);
    if (reason === "replaced") counters.replicaReplacements += 1;
    else counters.replicaDisconnects += 1;
  }

  function failPendingCommands(reason: string) {
    for (const commandId of [...pendingCommands.keys()]) {
      const pending = takePendingCommand(commandId);
      if (!pending) continue;
      if (replicas.get(pending.replica.id) === pending.replica) {
        postUnavailable(pending.replica, commandId, reason);
      }
    }
  }

  function clearPendingCommandsForReplica(connection: PortConnection) {
    for (const [commandId, pending] of [...pendingCommands]) {
      if (pending.replica === connection) takePendingCommand(commandId);
    }
  }

  function takePendingCommand(commandId: string): PendingCommand | null {
    const pending = pendingCommands.get(commandId);
    if (!pending) return null;
    pendingCommands.delete(commandId);
    clearTimeout(pending.timeout);
    return pending;
  }

  function requestBootstrap() {
    if (!authority || bootstrapRequested) return;
    const request = { type: "request-bootstrap" } satisfies PlaybackBootstrapRequest;
    if (postToConnection(authority, request)) {
      bootstrapRequested = true;
      return;
    }
    disconnectAuthority(authority, "transport-error", true);
  }

  function postUnavailable(connection: PortConnection, commandId: string, reason: string) {
    if (
      !postToConnection(connection, {
        commandId,
        reason,
        status: "unavailable",
      } satisfies PlaybackCommandReceipt)
    ) {
      disconnectReplica(connection, "transport-error", true);
    }
  }

  function postToConnection(connection: PortConnection, value: unknown) {
    if (connection.closed) return false;
    try {
      connection.port.postMessage(value);
      return true;
    } catch {
      return false;
    }
  }

  function reject(
    connection: PortConnection,
    source: "authority" | "replica",
    reason: PlaybackBrokerRejectionReason,
    value: unknown,
    validationReason?: string,
  ) {
    const details = describePayload(value);
    lastRejection = {
      connectionId: connection.id,
      reason,
      source,
      validationReason,
      ...details,
    };
    rejectionCounts[reason] += 1;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (authority) disconnectAuthority(authority, "disposed", true);
    else failPendingCommands("playback-broker-disposed");
    for (const replica of [...replicas.values()]) {
      disconnectReplica(replica, "disposed", true);
    }
  }

  function getDiagnostics(): PlaybackBrokerDiagnostics {
    return {
      ...counters,
      activeAuthorityId,
      activeSessionId,
      authorityConnectionId: authority?.id ?? null,
      bootstrapSequence: bootstrap?.sequence ?? null,
      disposed,
      lastRejection: lastRejection ? { ...lastRejection } : null,
      lastSequence,
      pendingCommandCount: pendingCommands.size,
      rejectionCounts: { ...rejectionCounts },
      replicaCount: replicas.size,
      replicaIds: [...replicas.keys()].sort(),
    };
  }

  function requireActiveBroker() {
    if (disposed) throw new Error("The playback broker is disposed.");
  }

  return { dispose, getDiagnostics, registerAuthority, registerReplica };
}

function synthesizeBootstrap<TLyrics>(
  current: PlaybackBootstrap<TLyrics>,
  message: Exclude<PlaybackMessage<TLyrics>, PlaybackBootstrap<TLyrics>>,
): PlaybackBootstrap<TLyrics> {
  return structuredClone({
    ...current,
    anchor: "anchor" in message ? message.anchor : current.anchor,
    authorityId: message.authorityId,
    sequence: message.sequence,
    sessionId: message.sessionId,
    state: message.type === "state-changed" ? message.state : current.state,
  });
}

function createConnection(id: string, port: PlaybackBrokerPort): PortConnection {
  return {
    closed: false,
    id,
    port,
    unsubscribeClose: () => undefined,
    unsubscribeMessage: () => undefined,
  };
}

function attachConnection(
  connection: PortConnection,
  onMessage: (message: unknown) => void,
  onClose: () => void,
) {
  connection.unsubscribeClose = connection.port.onClose(onClose);
  connection.unsubscribeMessage = connection.port.onMessage(onMessage);
}

function closeConnection(connection: PortConnection, closePort: boolean) {
  if (connection.closed) return;
  connection.closed = true;
  connection.unsubscribeMessage();
  connection.unsubscribeClose();
  if (!closePort) return;
  try {
    connection.port.close();
  } catch {
    // Closing is best-effort; all broker-owned listeners and state are already detached.
  }
}

function requireConnectionId(id: string, role: "authority" | "replica") {
  if (id.length === 0) throw new TypeError(`Playback ${role} ID must not be empty.`);
}

function describePayload(
  value: unknown,
): Pick<PlaybackBrokerRejection, "messageType" | "sequence"> {
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;
  return {
    ...(typeof record.type === "string" ? { messageType: record.type } : {}),
    ...(typeof record.sequence === "number" ? { sequence: record.sequence } : {}),
  };
}

function createRejectionCounts(): Record<PlaybackBrokerRejectionReason, number> {
  return {
    "authority-id-mismatch": 0,
    "bootstrap-required": 0,
    "duplicate-command-id": 0,
    "inactive-authority": 0,
    "inactive-replica": 0,
    "invalid-authority-payload": 0,
    "invalid-command": 0,
    "session-bootstrap-required": 0,
    "stale-sequence": 0,
    "uncloneable-message": 0,
    "unknown-command-receipt": 0,
  };
}

function once(action: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    action();
  };
}

export { adaptElectronPlaybackPort } from "./electronPort.js";
export type { PlaybackBrokerPort } from "./port.js";
