import type { PlaybackCommand, PlaybackCommandReceipt } from "@scopify/desktop-contract";
import { isPlaybackCommandReceipt } from "@scopify/desktop-contract";

import type { PlaybackBroker } from "@main/capabilities/playbackBroker";
import type { PlaybackBrokerPort } from "@main/capabilities/playbackBroker/port";

export interface MainPlaybackReplica {
  dispatch(command: PlaybackCommand): void;
  dispose(): void;
  onClose(listener: () => void): () => void;
  onReceipt(listener: (receipt: PlaybackCommandReceipt) => void): () => void;
}

/**
 * Creates the one trusted Replica owned by Electron Main.
 *
 * Unlike Renderer replicas this transport has no IPC surface: only code that
 * was given this object can issue a command. It still uses the Broker's normal
 * Replica path so command de-duplication, Authority replacement and receipt
 * timeouts retain exactly the same semantics as companion windows.
 */
export function createMainPlaybackReplica(
  broker: PlaybackBroker,
  replicaId: string,
): MainPlaybackReplica {
  const port = new InMemoryPlaybackBrokerPort();
  const release = broker.registerReplica(replicaId, port);
  let disposed = false;

  return {
    dispatch(command) {
      if (disposed) throw new Error("The Main playback replica is disposed.");
      port.receive(command);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      release();
    },
    onClose: (listener) => port.onInternalClose(listener),
    onReceipt(listener) {
      return port.onOutbound((message) => {
        if (isPlaybackCommandReceipt(message)) listener(structuredClone(message));
      });
    },
  };
}

/**
 * A tiny in-process MessagePort analogue. Keeping it here makes it impossible
 * for the Gateway to bypass the Broker and accidentally acquire different
 * command ordering or receipt rules than Electron Renderer replicas.
 */
class InMemoryPlaybackBrokerPort implements PlaybackBrokerPort {
  private closed = false;
  private readonly brokerCloseListeners = new Set<() => void>();
  private readonly brokerMessageListeners = new Set<(message: unknown) => void>();
  private readonly internalCloseListeners = new Set<() => void>();
  private readonly outboundListeners = new Set<(message: unknown) => void>();

  close() {
    if (this.closed) return;
    this.closed = true;
    for (const listener of [...this.internalCloseListeners]) listener();
    for (const listener of [...this.brokerCloseListeners]) listener();
    this.internalCloseListeners.clear();
    this.brokerCloseListeners.clear();
    this.brokerMessageListeners.clear();
    this.outboundListeners.clear();
  }

  onClose(listener: () => void) {
    this.brokerCloseListeners.add(listener);
    return once(() => this.brokerCloseListeners.delete(listener));
  }

  onInternalClose(listener: () => void) {
    this.internalCloseListeners.add(listener);
    return once(() => this.internalCloseListeners.delete(listener));
  }

  onMessage(listener: (message: unknown) => void) {
    this.brokerMessageListeners.add(listener);
    return once(() => this.brokerMessageListeners.delete(listener));
  }

  onOutbound(listener: (message: unknown) => void) {
    this.outboundListeners.add(listener);
    return once(() => this.outboundListeners.delete(listener));
  }

  postMessage(message: unknown) {
    if (this.closed) throw new Error("The Main playback replica transport is closed.");
    const cloned = structuredClone(message);
    for (const listener of [...this.outboundListeners]) listener(cloned);
  }

  receive(message: unknown) {
    if (this.closed) throw new Error("The Main playback replica transport is closed.");
    const cloned = structuredClone(message);
    for (const listener of [...this.brokerMessageListeners]) listener(cloned);
  }
}

function once(action: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    action();
  };
}
