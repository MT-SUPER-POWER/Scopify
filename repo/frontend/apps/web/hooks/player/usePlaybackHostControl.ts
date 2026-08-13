"use client";

import { useEffect } from "react";

import type { PlaybackHostSessionController } from "@/lib/playbackHost/sessionController";

/** Connects a stable Host session controller to its narrow control port. */
export function usePlaybackHostControl(
  controller: PlaybackHostSessionController<unknown> | null | undefined,
): void {
  useEffect(() => {
    if (!controller) return;
    return controller.connect();
  }, [controller]);
}
