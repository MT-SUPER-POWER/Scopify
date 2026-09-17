"use client";

import { useEffect, useState } from "react";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { SubtitlePlayback } from "@/types/subtitle-preview";

export function useSubtitlePlaybackPosition(
  playback: SubtitlePlayback,
  duration: number,
  loop: boolean,
) {
  const [position, setPosition] = useState(playback.position);
  useEffect(() => {
    const update = () =>
      setPosition(subtitlePlaybackPosition(playback, duration, loop, performance.now()));
    update();
    if (playback.startedAt === null) return;
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, [playback, duration, loop]);
  return position;
}
