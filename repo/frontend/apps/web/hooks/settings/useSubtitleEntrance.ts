"use client";

import { useEffect, useRef, useState } from "react";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SubtitlePlayback } from "@/types/subtitle-preview";

export function useSubtitleEntrance(
  settings: LyricsPreviewSettings,
  text: string,
  playback: SubtitlePlayback,
  loop: boolean,
) {
  const ref = useRef<HTMLDivElement>(null);
  const characters = Array.from(text);
  const typewriter = !settings.fillEnabled && settings.entrance === "typewriter";
  const [count, setCount] = useState(typewriter ? 0 : characters.length);
  const duration = settings.fillEnabled
    ? settings.fillDuration
    : typewriter
      ? Math.max(1, characters.length) * settings.characterInterval
      : settings.animationDuration;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let shown = -1;
    const transform =
      settings.entrance === "slide"
        ? "translateY(16px)"
        : settings.entrance === "scale"
          ? "scale(0.94)"
          : "none";
    const animation =
      !typewriter && settings.entrance !== "none"
        ? node.animate(
            [
              { opacity: 0, transform },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: settings.animationDuration,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "both",
            },
          )
        : undefined;
    animation?.pause();
    const draw = () => {
      const position = subtitlePlaybackPosition(playback, duration, loop, performance.now());
      const next =
        typewriter && !preference.matches
          ? Math.min(characters.length, Math.floor(position / settings.characterInterval))
          : characters.length;
      if (next !== shown) {
        shown = next;
        setCount(next);
      }
      if (animation)
        animation.currentTime = preference.matches
          ? settings.animationDuration
          : Math.min(position, settings.animationDuration);
      if (!preference.matches && playback.startedAt !== null && (loop || position < duration))
        frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      draw();
    };
    restart();
    preference.addEventListener("change", restart);
    return () => {
      cancelAnimationFrame(frame);
      animation?.cancel();
      preference.removeEventListener("change", restart);
    };
  }, [
    settings.entrance,
    settings.animationDuration,
    settings.characterInterval,
    characters.length,
    typewriter,
    duration,
    playback,
    loop,
  ]);
  return {
    ref,
    text: characters.slice(0, count).join(""),
    streaming: typewriter && count < characters.length,
  };
}
