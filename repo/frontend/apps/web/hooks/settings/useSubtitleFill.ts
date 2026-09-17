"use client";

import { useEffect, useRef } from "react";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { SubtitlePlayback } from "@/types/subtitle-preview";

export function useSubtitleFill(
  playback: SubtitlePlayback,
  duration: number,
  loop: boolean,
  enabled: boolean,
) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const draw = () => {
      const position = subtitlePlaybackPosition(playback, duration, loop, performance.now());
      const progress = preference.matches && playback.startedAt !== null ? 1 : position / duration;
      node.style.setProperty("--subtitle-progress", String(progress));
      if (
        enabled &&
        !preference.matches &&
        playback.startedAt !== null &&
        (loop || position < duration)
      ) {
        frame = requestAnimationFrame(draw);
      }
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      draw();
    };
    restart();
    preference.addEventListener("change", restart);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", restart);
    };
  }, [playback, duration, loop, enabled]);
  return ref;
}
