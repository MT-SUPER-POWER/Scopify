import { shallow } from "zustand/shallow";
import type { PlaybackProjectionExternalStore } from "@/types/playbackTransport";
import type { PlaybackProjectionSource } from "@/types/playbackProjection";
const PLAYBACK_CONNECTION_WATCHDOG_MS = 1_000;

export function createPlaybackProjectionStore<TLyrics>(source: PlaybackProjectionSource<TLyrics>) {
  let cachedSnapshot = source.getSnapshot();
  let unsubscribeSource: (() => void) | null = null;
  let watchdogHandle: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const refresh = () => {
    const nextSnapshot = source.getSnapshot();
    // Heartbeats keep the connection alive without changing a paused UI.
    // useSyncExternalStore requires the same object until visible values change.
    if (shallow(cachedSnapshot, nextSnapshot)) return;
    cachedSnapshot = nextSnapshot;
    notify();
  };
  const refreshConnection = () => {
    const nextSnapshot = source.getSnapshot();
    if (nextSnapshot.connection === cachedSnapshot.connection) return;
    cachedSnapshot = nextSnapshot;
    notify();
  };
  const stopWatching = () => {
    unsubscribeSource?.();
    unsubscribeSource = null;
    if (watchdogHandle !== null) clearInterval(watchdogHandle);
    watchdogHandle = null;
  };

  const store: PlaybackProjectionExternalStore<TLyrics> & { dispose(): void } = {
    dispatch: (command) => source.dispatch(command),
    dispose() {
      stopWatching();
      listeners.clear();
    },
    getSnapshot: () => cachedSnapshot,
    samplePositionMs: () => source.getSnapshot().positionMs,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        unsubscribeSource = source.subscribe(refresh);
        watchdogHandle = setInterval(refreshConnection, PLAYBACK_CONNECTION_WATCHDOG_MS);
        // Close the render-to-subscribe race without exposing unstable snapshots to React.
        refresh();
      }

      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        stopWatching();
      };
    },
  };

  return store;
}
