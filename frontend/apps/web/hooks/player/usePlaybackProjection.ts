"use client";

import { useContext, useEffect, useState, useSyncExternalStore } from "react";

import { PlaybackProjectionContext } from "@/components/player/PlaybackProjectionProvider";
import type { PlaybackProjectionExternalStore } from "@/types/playbackTransport";

export function usePlaybackProjection<TLyrics = unknown>() {
  const store = usePlaybackProjectionStore<TLyrics>();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Samples the Replica clock locally; callers never supply wall time or protocol metadata. */
export function usePlaybackPosition(): number {
  const store = usePlaybackProjectionStore();
  const projection = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [positionMs, setPositionMs] = useState(projection.positionMs);

  useEffect(() => {
    setPositionMs(store.samplePositionMs());
    if (projection.connection !== "connected" || !projection.isPlaying) return;

    let animationFrame = requestAnimationFrame(samplePosition);

    function samplePosition() {
      const nextPositionMs = store.samplePositionMs();
      setPositionMs((currentPositionMs) =>
        currentPositionMs === nextPositionMs ? currentPositionMs : nextPositionMs,
      );
      animationFrame = requestAnimationFrame(samplePosition);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [projection.connection, projection.isPlaying, projection.positionMs, store]);

  return positionMs;
}

/** Explicit unit alias for consumers that expose several time scales. */
export const usePlaybackPositionMs = usePlaybackPosition;

export function usePlaybackProjectionStore<TLyrics = unknown>() {
  const store = useContext(PlaybackProjectionContext);
  if (!store) {
    throw new Error("Playback hooks must be used within a PlaybackProjectionProvider");
  }
  return store as PlaybackProjectionExternalStore<TLyrics>;
}
