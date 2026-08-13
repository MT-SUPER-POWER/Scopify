import {
  type PlaybackHostControlTransportRole,
  type PlaybackHostClientCommand,
  type PlaybackHostHostMessage,
  validatePlaybackHostClientCommand,
  validatePlaybackHostControlReceipt,
  validatePlaybackHostSessionSnapshot,
} from "@scopifymusicplayer/desktop-contract";

/** Main Window receives only Host-owned receipts and session snapshots. */
export type PlaybackHostControlClientInboundPayload = PlaybackHostHostMessage;
/** Hidden Host receives every client command, including queue intents. */
export type PlaybackHostControlHostInboundPayload = PlaybackHostClientCommand;
export type PlaybackHostControlClientOutboundPayload = PlaybackHostClientCommand;
export type PlaybackHostControlHostOutboundPayload = PlaybackHostHostMessage;

export type PlaybackHostControlInboundPayload<TRole extends PlaybackHostControlTransportRole> =
  TRole extends "client"
    ? PlaybackHostControlClientInboundPayload
    : PlaybackHostControlHostInboundPayload;

export type PlaybackHostControlOutboundPayload<TRole extends PlaybackHostControlTransportRole> =
  TRole extends "client"
    ? PlaybackHostControlClientOutboundPayload
    : PlaybackHostControlHostOutboundPayload;

export interface PlaybackHostControlRendererPort {
  close(): void;
  onclose: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: unknown): void;
  start(): void;
}

export interface PlaybackHostControlRendererChannel {
  port1: PlaybackHostControlRendererPort;
  /** Electron requires a real DOM MessagePort as the transferable IPC endpoint. */
  port2: MessagePort;
}

export interface PlaybackHostControlPreloadTransportOptions {
  createChannel(): PlaybackHostControlRendererChannel;
  connectPort(
    connectionId: string,
    role: PlaybackHostControlTransportRole,
    port: MessagePort,
  ): void;
}

export interface PlaybackHostControlPreloadTransport<
  TRole extends PlaybackHostControlTransportRole,
> {
  connect(
    connectionId: string,
    onPayload: (payload: PlaybackHostControlInboundPayload<TRole>) => void,
    onClose: () => void,
  ): () => void;
  send(payload: PlaybackHostControlOutboundPayload<TRole>): boolean;
}

/**
 * Isolated preload-side endpoint for the reliable, low-rate playback-host
 * control channel. The Electron main process still validates and authorizes
 * both ends; this guard prevents a renderer from using its narrow bridge in
 * the wrong protocol direction before a payload reaches that process.
 */
export function createPlaybackHostControlPreloadTransport<
  TRole extends PlaybackHostControlTransportRole,
>(
  role: TRole,
  options: PlaybackHostControlPreloadTransportOptions,
): PlaybackHostControlPreloadTransport<TRole> {
  let activePort: PlaybackHostControlRendererPort | null = null;

  function closePort(port: PlaybackHostControlRendererPort | null) {
    if (!port) return;
    port.onmessage = null;
    port.onmessageerror = null;
    port.onclose = null;
    try {
      port.close();
    } catch {
      // A detached MessagePort is already closed; this channel is isolated.
    }
  }

  function closeActivePort(port = activePort) {
    if (!port || activePort !== port) return false;
    activePort = null;
    closePort(port);
    return true;
  }

  return {
    connect(connectionId, onPayload, onClose) {
      closeActivePort();
      const channel = options.createChannel();
      const port = channel.port1;
      activePort = port;

      port.onmessage = (event) => {
        if (activePort !== port) return;
        const payload = parseInboundPayload(event.data, role);
        if (!payload) return;
        onPayload(payload as PlaybackHostControlInboundPayload<TRole>);
      };
      port.onmessageerror = () => {
        if (!closeActivePort(port)) return;
        onClose();
      };
      port.onclose = () => {
        if (!closeActivePort(port)) return;
        onClose();
      };

      try {
        port.start();
        options.connectPort(connectionId, role, channel.port2);
      } catch {
        if (closeActivePort(port)) onClose();
      }

      return () => {
        closeActivePort(port);
      };
    },
    send(payload) {
      const port = activePort;
      if (!port || !isOutboundPayload(payload, role)) return false;
      try {
        port.postMessage(payload);
        return true;
      } catch {
        return false;
      }
    },
  };
}

function parseInboundPayload(
  value: unknown,
  role: PlaybackHostControlTransportRole,
): PlaybackHostControlClientInboundPayload | PlaybackHostControlHostInboundPayload | null {
  if (role === "host") {
    const command = validatePlaybackHostClientCommand(value);
    return command.success ? command.command : null;
  }

  const receipt = validatePlaybackHostControlReceipt(value);
  if (receipt.success) return receipt.receipt;
  const snapshot = validatePlaybackHostSessionSnapshot(value);
  return snapshot.success ? snapshot.snapshot : null;
}

function isOutboundPayload(
  value: unknown,
  role: PlaybackHostControlTransportRole,
): value is PlaybackHostControlClientOutboundPayload | PlaybackHostControlHostOutboundPayload {
  if (role === "client") return validatePlaybackHostClientCommand(value).success;
  return (
    validatePlaybackHostControlReceipt(value).success ||
    validatePlaybackHostSessionSnapshot(value).success
  );
}
