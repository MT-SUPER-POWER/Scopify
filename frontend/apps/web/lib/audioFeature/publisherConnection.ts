import type {
  AudioFeaturePublisherConnection,
  AudioFeaturePublisherConnectionOptions,
} from "@/types/audioFeaturePublisher";

const NOOP = () => {};
const DEFAULT_TIMER = {
  clearTimeout(handle: unknown) {
    globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>);
  },
  setTimeout(callback: () => void, delayMs: number) {
    return globalThis.setTimeout(callback, delayMs);
  },
};

/** Only the hidden Electron Host may publish its analyser feature stream. */
export function shouldConnectAudioFeaturePublisher(
  isDesktop: boolean,
  playbackHostNonce: string | null,
): boolean {
  return isDesktop && playbackHostNonce !== null;
}

/**
 * Owns the publisher transport independently from React. A passive port close
 * resets only the frame stream, preserves the fixed-rate sampler, and retries
 * one fresh transport after the configured delay.
 */
export function createAudioFeaturePublisherConnection(
  options: AudioFeaturePublisherConnectionOptions,
): AudioFeaturePublisherConnection {
  let disposed = false;
  let started = false;
  let reconnectTimer: unknown | null = null;
  let transportGeneration = 0;
  let unsubscribeTransport: () => void = NOOP;
  const timer = options.timer ?? DEFAULT_TIMER;

  const clearReconnectTimer = () => {
    if (reconnectTimer === null) return;
    timer.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const connectTransport = () => {
    const connectionGeneration = ++transportGeneration;
    unsubscribeTransport();
    unsubscribeTransport = options.transport.connect(
      "publisher",
      options.connectionId,
      NOOP,
      () => {
        if (disposed || connectionGeneration !== transportGeneration) return;
        options.sampler.disconnect();
        if (reconnectTimer !== null) return;
        reconnectTimer = timer.setTimeout(() => {
          reconnectTimer = null;
          if (!disposed) connectTransport();
        }, options.reconnectDelayMs);
      },
    );
  };

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      clearReconnectTimer();
      unsubscribeTransport();
      unsubscribeTransport = NOOP;
      options.sampler.stop();
    },
    start() {
      if (disposed || started) return;
      started = true;
      options.sampler.start();
      connectTransport();
    },
  };
}
