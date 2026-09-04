import { randomUUID } from "node:crypto";

import type {
  PlaybackBootstrap,
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackProjection,
} from "@scopify/desktop-contract";
import { validatePlaybackCommand } from "@scopify/desktop-contract";

import type { PlaybackBroker } from "@main/capabilities/playbackBroker";

import { createMainPlaybackReplica } from "./mainReplica";

type WithoutCommandId<TCommand extends PlaybackCommand> = TCommand extends unknown
  ? Omit<TCommand, "commandId">
  : never;

/** A trusted Main-process command. Gateway-owned IDs prevent cross-client collisions. */
export type PlaybackGatewayCommand = WithoutCommandId<PlaybackCommand>;

export type PlaybackGatewayListener<TLyrics = unknown> = (
  snapshot: PlaybackProjection<TLyrics> | null,
) => void;

/**
 * The narrow playback-control Interface used by trusted Main-process modules.
 *
 * It deliberately exposes state and commands, not Renderer transport details.
 * MCP, tray controls and future Native playback can therefore share this seam
 * without importing BrowserWindow, MessagePort, Zustand or HTMLAudioElement.
 */
export interface PlaybackGateway<TLyrics = unknown> {
  dispose(): void;
  dispatch(command: PlaybackGatewayCommand): Promise<PlaybackCommandReceipt>;
  getSnapshot(): PlaybackProjection<TLyrics> | null;
  next(): Promise<PlaybackCommandReceipt>;
  pause(): Promise<PlaybackCommandReceipt>;
  play(): Promise<PlaybackCommandReceipt>;
  previous(): Promise<PlaybackCommandReceipt>;
  seek(positionMs: number): Promise<PlaybackCommandReceipt>;
  setVolume(volume: number): Promise<PlaybackCommandReceipt>;
  subscribe(listener: PlaybackGatewayListener<TLyrics>): () => void;
  toggle(): Promise<PlaybackCommandReceipt>;
}

export interface PlaybackGatewayOptions {
  /** Injected by tests; production IDs are unguessable and unique per command. */
  commandIdFactory?(): string;
  /** Injected by tests; production callers should retain the default private ID. */
  replicaId?: string;
}

/**
 * Adapts a PlaybackBroker into a Main-process PlaybackGateway.
 *
 * The Gateway is intentionally a normal Broker replica instead of a special
 * direct call path. That preserves one authority, one command protocol and one
 * source of receipts while the Web Renderer owns playback execution.
 */
export function createPlaybackGateway<TLyrics = unknown>(
  broker: PlaybackBroker<TLyrics>,
  options: PlaybackGatewayOptions = {},
): PlaybackGateway<TLyrics> {
  const replica = createMainPlaybackReplica(
    broker,
    options.replicaId ?? `main:playback-gateway:${randomUUID()}`,
  );
  const commandIdFactory = options.commandIdFactory ?? randomUUID;
  let disposed = false;
  let snapshot = projectBootstrap(broker.getBootstrap());

  const listeners = new Set<PlaybackGatewayListener<TLyrics>>();
  const pendingReceipts = new Map<string, (receipt: PlaybackCommandReceipt) => void>();

  const unsubscribeBroker = broker.subscribe(() => {
    const nextSnapshot = projectBootstrap(broker.getBootstrap());
    snapshot = nextSnapshot;
    notifyListeners();
  });
  const unsubscribeReceipts = replica.onReceipt((receipt) => {
    const settle = pendingReceipts.get(receipt.commandId);
    if (!settle) return;
    pendingReceipts.delete(receipt.commandId);
    settle(receipt);
  });
  const unsubscribeReplicaClose = replica.onClose(() => {
    settleAll("playback-gateway-replica-closed");
  });

  function getSnapshot() {
    return snapshot ? structuredClone(snapshot) : null;
  }

  function subscribe(listener: PlaybackGatewayListener<TLyrics>) {
    listeners.add(listener);
    return once(() => listeners.delete(listener));
  }

  function dispatch(command: PlaybackGatewayCommand): Promise<PlaybackCommandReceipt> {
    let commandId: string;
    try {
      commandId = commandIdFactory();
    } catch {
      return Promise.resolve(rejected("command-id-factory-failed", "playback-gateway-command"));
    }
    const receiptCommandId = toReceiptCommandId(commandId);
    if (disposed)
      return Promise.resolve(unavailable("playback-gateway-disposed", receiptCommandId));
    if (broker.getDiagnostics().disposed) {
      return Promise.resolve(unavailable("playback-broker-disposed", receiptCommandId));
    }
    const completeCommand = { ...command, commandId } as PlaybackCommand;
    const validation = validatePlaybackCommand(completeCommand);
    if (!validation.success) {
      return Promise.resolve(rejected(validation.reason, receiptCommandId));
    }
    if (pendingReceipts.has(commandId)) {
      return Promise.resolve(rejected("duplicate-command-id", commandId));
    }

    return new Promise((resolve) => {
      pendingReceipts.set(commandId, resolve);
      try {
        replica.dispatch(validation.command);
      } catch {
        const settle = pendingReceipts.get(commandId);
        if (!settle) return;
        pendingReceipts.delete(commandId);
        settle(unavailable("playback-gateway-replica-closed", commandId));
      }
    });
  }

  function play() {
    return dispatch({ type: "play" });
  }

  function pause() {
    return dispatch({ type: "pause" });
  }

  function toggle() {
    return dispatch({ type: "toggle" });
  }

  function next() {
    return dispatch({ type: "next" });
  }

  function previous() {
    return dispatch({ type: "previous" });
  }

  function seek(positionMs: number) {
    return dispatch({ positionMs, type: "seek" });
  }

  function setVolume(volume: number) {
    return dispatch({ type: "set-volume", volume });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    snapshot = null;
    settleAll("playback-gateway-disposed");
    unsubscribeBroker();
    unsubscribeReceipts();
    unsubscribeReplicaClose();
    replica.dispose();
    notifyListeners();
    listeners.clear();
  }

  function settleAll(reason: string) {
    for (const [commandId, settle] of [...pendingReceipts]) {
      pendingReceipts.delete(commandId);
      settle(unavailable(reason, commandId));
    }
  }

  function notifyListeners() {
    const current = getSnapshot();
    for (const listener of [...listeners]) {
      try {
        listener(current ? structuredClone(current) : null);
      } catch {
        // Observers are passive. A broken subscriber must never make playback
        // control unavailable to the next Main-process caller.
      }
    }
  }

  return {
    dispose,
    dispatch,
    getSnapshot,
    next,
    pause,
    play,
    previous,
    seek,
    setVolume,
    subscribe,
    toggle,
  };
}

function projectBootstrap<TLyrics>(
  bootstrap: PlaybackBootstrap<TLyrics> | null,
): PlaybackProjection<TLyrics> | null {
  if (!bootstrap) return null;

  return structuredClone({
    ...bootstrap.state,
    authorityId: bootstrap.authorityId,
    connection: "connected",
    isPlaying: bootstrap.state.phase === "playing",
    positionMs: bootstrap.anchor.positionMs,
    sessionId: bootstrap.sessionId,
  });
}

function rejected(reason: string, commandId: string): PlaybackCommandReceipt {
  return { commandId, reason, status: "rejected" };
}

function unavailable(reason: string, commandId: string): PlaybackCommandReceipt {
  return { commandId, reason, status: "unavailable" };
}

function toReceiptCommandId(commandId: unknown): string {
  return typeof commandId === "string" && commandId.length > 0
    ? commandId
    : "playback-gateway-invalid-command-id";
}

function once(action: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    action();
  };
}
