"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";

import {
  LANDING_SONNET_LINES,
  resolveCurrentLineIndex,
  resolveLoopTime,
  resolveVisualBeat,
} from "@/lib/marketing/folia-sonnet-timeline";

export function useLandingSonnetTimeline(paused: boolean) {
  const currentTime = useMotionValue(0);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const lineIndexRef = useRef(0);
  const audioBands = useMemo(
    () => ({ bass, lowMid, mid, vocal, treble }),
    [bass, lowMid, mid, vocal, treble],
  );

  useEffect(() => {
    let animationFrame = 0;
    const startedAt = performance.now();

    const update = (now: number) => {
      const time = paused ? 4.8 : resolveLoopTime((now - startedAt) / 1000);
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
      if (!paused) animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [audioPower, bass, currentTime, lowMid, mid, paused, treble, vocal]);

  return {
    audioBands,
    audioPower,
    currentLineIndex,
    currentTime,
    lines: LANDING_SONNET_LINES,
  };
}
