import {
  type PlaybackCommand,
  type PlaybackCommandReceipt,
  type PlaybackTransportPayload,
  isPlaybackTransportControl,
  validatePlaybackCommand,
  validatePlaybackCommandReceipt,
} from "@scopifymusicplayer/desktop-contract";

import { createPlaybackReplica } from "@/lib/playbackProjection/replica";
import type { PlaybackAuthorityBinding } from "@/types/playbackAuthority";
import type {
  ElectronPlaybackAuthorityTransport,
  ElectronPlaybackAuthorityTransportOptions,
  ElectronPlaybackReplicaTransport,
  ElectronPlaybackReplicaTransportOptions,
} from "@/types/playbackTransport";

export const DEFAULT_PLAYBACK_COMMAND_TIMEOUT_MS = 15_000;
export const MAX_PLAYBACK_COMMAND_TIMEOUT_MS = 30_000;

interface PendingCommand {
  resolve(receipt: PlaybackCommandReceipt): void;
  timeout: ReturnType<typeof setTimeout>;
}

export function createElectronPlaybackReplicaTransport<TLyrics = unknown>({
  clock,
  commandTimeoutMs = DEFAULT_PLAYBACK_COMMAND_TIMEOUT_MS,
  connectionId,
  disconnectAfterMs,
  port,
}: ElectronPlaybackReplicaTransportOptions<TLyrics>): ElectronPlaybackReplicaTransport<TLyrics> {
  assertConnectionId(connectionId, "Replica");
  assertCommandTimeout(commandTimeoutMs);

  const pendingCommands = new Map<string, PendingCommand>();
  let closed = false;
  let disconnectPort: (() => void) | null = null;

  const replica = createPlaybackReplica<TLyrics>({
    clock,
    disconnectAfterMs,
    dispatchCommand,
  });

  function dispatchCommand(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    if (closed) return Promise.resolve(unavailable(command, "playback-transport-disconnected"));
    if (pendingCommands.has(command.commandId)) {
      return Promise.resolve(unavailable(command, "duplicate-pending-command-id"));
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pendingCommands.delete(command.commandId);
        resolve(unavailable(command, "command-receipt-timeout"));
      }, commandTimeoutMs);
      pendingCommands.set(command.commandId, { resolve, timeout });

      try {
        if (port.send(command)) return;
      } catch {
        // The send failure is converted into a bounded unavailable receipt below.
      }
      settleCommand(unavailable(command, "playback-transport-send-failed"));
    });
  }

  function receive(payload: PlaybackTransportPayload<TLyrics>) {
    const receiptValidation = validatePlaybackCommandReceipt(payload);
    if (receiptValidation.success) {
      settleCommand(receiptValidation.receipt);
      return;
    }
    replica.receive(payload);
  }

  function settleCommand(receipt: PlaybackCommandReceipt) {
    const pending = pendingCommands.get(receipt.commandId);
    if (!pending) return;
    pendingCommands.delete(receipt.commandId);
    clearTimeout(pending.timeout);
    pending.resolve(receipt);
  }

  function freeze(reason: string) {
    if (closed) return;
    closed = true;
    replica.disconnect();
    for (const commandId of [...pendingCommands.keys()]) {
      settleCommand({ commandId, reason, status: "unavailable" });
    }
  }

  try {
    disconnectPort = port.connect("replica", connectionId, receive, () =>
      freeze("playback-transport-disconnected"),
    );
  } catch (error) {
    freeze("playback-transport-connect-failed");
    throw error;
  }

  return {
    close() {
      if (closed) return;
      disconnectPort?.();
      disconnectPort = null;
      freeze("playback-transport-closed");
    },
    source: replica,
  };
}

export function createElectronPlaybackAuthorityTransport<TLyrics = unknown>({
  connectionId,
  port,
}: ElectronPlaybackAuthorityTransportOptions<TLyrics>): ElectronPlaybackAuthorityTransport<TLyrics> {
  assertConnectionId(connectionId, "Authority");

  let binding: PlaybackAuthorityBinding | null = null;
  let closed = false;
  let disconnectPort: (() => void) | null = null;

  function disconnectBinding() {
    binding = null;
    disconnectPort?.();
    disconnectPort = null;
  }

  async function receive(payload: PlaybackTransportPayload<TLyrics>) {
    const activeBinding = binding;
    if (!activeBinding) return;
    if (isPlaybackTransportControl(payload)) {
      try {
        activeBinding.requestBootstrap();
      } catch {
        // The next health message or Replica reconnect will request it again.
      }
      return;
    }

    const commandValidation = validatePlaybackCommand(payload);
    if (!commandValidation.success) return;

    const command = commandValidation.command;
    let receipt: PlaybackCommandReceipt;
    try {
      receipt = await activeBinding.dispatch(command);
      if (receipt.commandId !== command.commandId) {
        receipt = unavailable(command, "mismatched-command-receipt");
      }
    } catch {
      receipt = unavailable(command, "command-dispatch-failed");
    }

    if (!closed && binding === activeBinding) {
      try {
        port.send(receipt);
      } catch {
        // The broker will time out the command if this connection closed while it executed.
      }
    }
  }

  return {
    close() {
      if (closed) return;
      closed = true;
      disconnectBinding();
    },
    connectAuthority(nextBinding) {
      if (closed) throw new Error("The Electron playback Authority transport is closed");
      if (binding) throw new Error("The Electron playback transport already has an Authority");

      binding = nextBinding;
      try {
        disconnectPort = port.connect("authority", connectionId, receive, disconnectBinding);
        nextBinding.requestBootstrap();
      } catch (error) {
        disconnectBinding();
        throw error;
      }

      return () => {
        if (binding === nextBinding) disconnectBinding();
      };
    },
    publish(message) {
      if (closed || !binding) return false;
      try {
        return port.send(message);
      } catch {
        return false;
      }
    },
  };
}

function unavailable(command: PlaybackCommand, reason: string): PlaybackCommandReceipt {
  return { commandId: command.commandId, reason, status: "unavailable" };
}

function assertConnectionId(connectionId: string, role: "Authority" | "Replica") {
  if (connectionId.length === 0) throw new TypeError(`Playback ${role} ID must not be empty`);
}

function assertCommandTimeout(commandTimeoutMs: number) {
  if (
    !Number.isFinite(commandTimeoutMs) ||
    commandTimeoutMs <= 0 ||
    commandTimeoutMs > MAX_PLAYBACK_COMMAND_TIMEOUT_MS
  ) {
    throw new RangeError(
      `commandTimeoutMs must be between 1 and ${MAX_PLAYBACK_COMMAND_TIMEOUT_MS} milliseconds`,
    );
  }
}
