"use client";

import { createContext, useEffect, useMemo } from "react";

import type {
  PlaybackProjectionExternalStore,
  PlaybackProjectionProviderProps,
} from "@/types/playbackTransport";

const PLAYBACK_CONNECTION_WATCHDOG_MS = 1_000;

export const PlaybackProjectionContext =
  createContext<PlaybackProjectionExternalStore<unknown> | null>(null);

PlaybackProjectionContext.displayName = "PlaybackProjectionContext";

export function PlaybackProjectionProvider<TLyrics = unknown>({
  children,
  source,
}: PlaybackProjectionProviderProps<TLyrics>) {
  const store = useMemo(() => createProjectionStore(source), [source]);

  useEffect(() => () => store.dispose(), [store]);

  return (
    <PlaybackProjectionContext.Provider value={store}>
      {children}
    </PlaybackProjectionContext.Provider>
  );
}

function createProjectionStore<TLyrics>(
  source: PlaybackProjectionProviderProps<TLyrics>["source"],
) {
  let cachedSnapshot = source.getSnapshot();
  let unsubscribeSource: (() => void) | null = null;
  let watchdogHandle: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const refresh = () => {
    cachedSnapshot = source.getSnapshot();
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
