"use client";

import { useEffect, useState } from "react";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { SubtitlePlayback } from "@/types/subtitle-preview";

export function useSubtitlePreviewPlaying(
  playback: SubtitlePlayback,
  duration: number,
  loop: boolean,
) {
  const [completed, setCompleted] = useState<SubtitlePlayback | null>(null);
  useEffect(() => {
    if (playback.startedAt === null || loop) return;
    const remaining =
      duration - subtitlePlaybackPosition(playback, duration, false, performance.now());
    const timer = setTimeout(() => setCompleted(playback), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [playback, duration, loop]);
  return playback.startedAt !== null && (loop || completed !== playback);
}
