"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";

import {
  clampProgress,
  LANDING_CINEMATIC_LINES,
  resolveCinematicMode,
  resolveCurrentLineIndex,
  resolvePlaybackTime,
  resolveVisualBeat,
} from "@/lib/marketing/folia-cinematic-timeline";

export function useLandingCinematicTimeline() {
  const containerRef = useRef<HTMLElement | null>(null);
  const currentTime = useMotionValue(0);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const [progress, setProgress] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const lineIndexRef = useRef(0);
  const progressRef = useRef(0);

  const audioBands = useMemo(
    () => ({ bass, lowMid, mid, vocal, treble }),
    [bass, lowMid, mid, vocal, treble],
  );

  useEffect(() => {
    let animationFrame = 0;

    const updateScrollProgress = () => {
      animationFrame = 0;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const travel = Math.max(1, container.offsetHeight - window.innerHeight);
      const nextProgress = clampProgress(-rect.top / travel);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    };

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(updateScrollProgress);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const startedAt = performance.now();

    const updatePlayback = (now: number) => {
      const nextProgress = progressRef.current;
      const mode = resolveCinematicMode(nextProgress);
      const elapsedTime = (now - startedAt) / 1000;
      const time = resolvePlaybackTime(mode, nextProgress, elapsedTime);
      const beat = resolveVisualBeat(time);
      const nextLineIndex = resolveCurrentLineIndex(time);

      currentTime.set(time);
      audioPower.set(beat.power);
      bass.set(beat.bass);
      lowMid.set(beat.lowMid);
      mid.set(beat.mid);
      vocal.set(beat.vocal);
      treble.set(beat.treble);

      if (nextLineIndex !== lineIndexRef.current) {
        lineIndexRef.current = nextLineIndex;
        setCurrentLineIndex(nextLineIndex);
      }

      animationFrame = requestAnimationFrame(updatePlayback);
    };

    animationFrame = requestAnimationFrame(updatePlayback);
    return () => cancelAnimationFrame(animationFrame);
  }, [audioPower, bass, currentTime, lowMid, mid, treble, vocal]);

  return {
    containerRef,
    timeline: {
      audioBands,
      audioPower,
      currentLineIndex,
      currentTime,
      lines: LANDING_CINEMATIC_LINES,
      mode: resolveCinematicMode(progress),
      progress,
    },
  };
}
