"use client";

import { useContext, useEffect, useState, useSyncExternalStore } from "react";

import { PlaybackProjectionContext } from "@/components/player/PlaybackProjectionProvider";
import { PLAYBACK_PROGRESS_SAMPLE_INTERVAL_MS } from "@/constants/performance";
import { usePerformanceStore } from "@/store/module/performance";
import type { PlaybackProjectionExternalStore } from "@/types/playbackTransport";

export function usePlaybackProjection<TLyrics = unknown>() {
  const store = usePlaybackProjectionStore<TLyrics>();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Samples the Replica clock locally; callers never supply wall time or protocol metadata. */
export function usePlaybackPosition(enabled = true): number {
  const store = usePlaybackProjectionStore();
  const projection = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [positionMs, setPositionMs] = useState(projection.positionMs);
  const sampleIntervalMs = usePerformanceStore(
    (state) => PLAYBACK_PROGRESS_SAMPLE_INTERVAL_MS[state.progressRefreshRate],
  );

  useEffect(() => {
    setPositionMs(store.samplePositionMs());
    if (!enabled || projection.connection !== "connected" || !projection.isPlaying) return;

    let lastSampledAt = Number.NEGATIVE_INFINITY;
    let animationFrame = requestAnimationFrame(samplePosition);

    function samplePosition(frameTime: number) {
      if (frameTime - lastSampledAt >= sampleIntervalMs) {
        lastSampledAt = frameTime;
        const nextPositionMs = store.samplePositionMs();
        setPositionMs((currentPositionMs) =>
          currentPositionMs === nextPositionMs ? currentPositionMs : nextPositionMs,
        );
      }
      animationFrame = requestAnimationFrame(samplePosition);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [
    enabled,
    projection.connection,
    projection.isPlaying,
    projection.positionMs,
    sampleIntervalMs,
    store,
  ]);

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
