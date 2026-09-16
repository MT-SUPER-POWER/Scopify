"use client";

import { createContext, useEffect, useMemo } from "react";

import type {
  PlaybackProjectionExternalStore,
  PlaybackProjectionProviderProps,
} from "@/types/playbackTransport";

import { createPlaybackProjectionStore } from "@/lib/playbackProjection/externalStore";

export const PlaybackProjectionContext =
  createContext<PlaybackProjectionExternalStore<unknown> | null>(null);

PlaybackProjectionContext.displayName = "PlaybackProjectionContext";

export function PlaybackProjectionProvider<TLyrics = unknown>({
  children,
  source,
}: PlaybackProjectionProviderProps<TLyrics>) {
  const store = useMemo(() => createPlaybackProjectionStore(source), [source]);

  useEffect(() => () => store.dispose(), [store]);

  return (
    <PlaybackProjectionContext.Provider value={store}>
      {children}
    </PlaybackProjectionContext.Provider>
  );
}
