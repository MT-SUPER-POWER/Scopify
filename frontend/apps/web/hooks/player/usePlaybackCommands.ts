"use client";

import { useMemo } from "react";

import { usePlaybackProjectionStore } from "@/hooks/player/usePlaybackProjection";
import type { PlaybackCommands } from "@/types/playbackTransport";

let nextCommandSequence = 0;

export function usePlaybackCommands(): PlaybackCommands {
  const store = usePlaybackProjectionStore();

  return useMemo(
    () => ({
      next: () => store.dispatch({ commandId: createCommandId("next"), type: "next" }),
      pause: () => store.dispatch({ commandId: createCommandId("pause"), type: "pause" }),
      play: () => store.dispatch({ commandId: createCommandId("play"), type: "play" }),
      previous: () => store.dispatch({ commandId: createCommandId("previous"), type: "previous" }),
      seek: (positionMs) =>
        store.dispatch({ commandId: createCommandId("seek"), positionMs, type: "seek" }),
      setVolume: (volume) =>
        store.dispatch({ commandId: createCommandId("set-volume"), type: "set-volume", volume }),
      toggle: () => store.dispatch({ commandId: createCommandId("toggle"), type: "toggle" }),
      toggleLike: () =>
        store.dispatch({ commandId: createCommandId("toggle-like"), type: "toggle-like" }),
    }),
    [store],
  );
}

function createCommandId(commandType: string): string {
  nextCommandSequence += 1;
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${commandType}-${randomId}-${nextCommandSequence.toString(36)}`;
}
