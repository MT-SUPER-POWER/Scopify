"use client";

import { useEffect, useRef, useState } from "react";

interface LyricPlaybackClockOptions {
  initialTimeMs: number;
  isPlaying: boolean;
}

/**
 * Keeps lyric presentation smooth between native audio `timeupdate` events.
 * Audio remains the source of truth; this hook only interpolates frames for
 * visualizers and never writes playback state.
 */
export function useLyricPlaybackClock({
  initialTimeMs,
  isPlaying,
}: LyricPlaybackClockOptions): number {
  const [timeMs, setTimeMs] = useState(initialTimeMs);
  const sourceTimeRef = useRef(initialTimeMs);
  const sourceTimestampRef = useRef(performance.now());
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    sourceTimeRef.current = initialTimeMs;
    sourceTimestampRef.current = performance.now();
    setTimeMs(initialTimeMs);
  }, [initialTimeMs]);

  useEffect(() => {
    const onPlayerTime = (event: Event) => {
      const nextTimeMs = (event as CustomEvent<unknown>).detail;
      if (typeof nextTimeMs !== "number" || !Number.isFinite(nextTimeMs)) return;
      sourceTimeRef.current = nextTimeMs;
      sourceTimestampRef.current = performance.now();
      setTimeMs(nextTimeMs);
    };

    let animationFrame = 0;
    const tick = () => {
      if (isPlayingRef.current) {
        const nextTimeMs = sourceTimeRef.current + (performance.now() - sourceTimestampRef.current);
        setTimeMs(nextTimeMs);
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("player-time", onPlayerTime);
    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("player-time", onPlayerTime);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return timeMs;
}
