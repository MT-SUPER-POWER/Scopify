import type { RuntimePlaybackHostControlConnection, RuntimeUnsubscribe } from "@/lib/runtime/types";

/**
 * A role-bound, single-port control transport supplied by a renderer host.
 *
 * The preload bridge has one port for each role. This adapter turns that port
 * into an explicit connection object so callers cannot accidentally keep
 * sending after their React/runtime lifecycle has disconnected.
 */
export interface PlaybackHostControlTransportPort<TIncoming, TOutgoing> {
  connect(
    connectionId: string,
    onPayload: (payload: TIncoming) => void,
    onClose: () => void,
  ): RuntimeUnsubscribe;
  send(payload: TOutgoing): boolean;
}

export function connectPlaybackHostControlTransport<TIncoming, TOutgoing>(
  port: PlaybackHostControlTransportPort<TIncoming, TOutgoing>,
  connectionId: string,
  onPayload: (payload: TIncoming) => void,
  onClose: () => void,
): RuntimePlaybackHostControlConnection<TOutgoing> {
  let closed = false;
  let unsubscribe: RuntimeUnsubscribe | null = null;

  const disconnect = (notify: boolean) => {
    if (closed) return;

    closed = true;
    const currentUnsubscribe = unsubscribe;
    unsubscribe = null;
    currentUnsubscribe?.();
    if (notify) onClose();
  };

  const connectedUnsubscribe = port.connect(
    connectionId,
    (payload) => {
      if (!closed) onPayload(payload);
    },
    () => disconnect(true),
  );

  // A preload may synchronously notify a rejected/closed connection. Its
  // cleanup still needs to run once it becomes available.
  if (closed) connectedUnsubscribe();
  else unsubscribe = connectedUnsubscribe;

  return {
    close: () => disconnect(false),
    send: (payload) => {
      if (closed) return false;
      try {
        return port.send(payload);
      } catch {
        disconnect(true);
        return false;
      }
    },
  };
}
