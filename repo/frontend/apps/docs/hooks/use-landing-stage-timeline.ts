"use client";

import type { Line } from "@folia/types";
import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  STAGE_LINE_SECONDS,
  resolveCurrentLineIndex,
  resolveLoopDuration,
  resolveLoopTime,
  resolveVisualBeat,
} from "@/lib/marketing/landing-stage-timeline";

/** 减少动态效果时定格在第一句唱到一半。 */
const PAUSED_TIME = STAGE_LINE_SECONDS * 0.5;

/** 给 Folia 歌词动画喂时间、当前句与模拟的频段能量；换一场词就从第一句重新唱。 */
export function useLandingStageTimeline(lines: Line[], paused: boolean) {
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
    const loopDuration = resolveLoopDuration(lines);

    const update = (now: number) => {
      const time = paused ? PAUSED_TIME : resolveLoopTime((now - startedAt) / 1000, loopDuration);
      const beat = resolveVisualBeat(time);
      const nextLineIndex = resolveCurrentLineIndex(lines, time);

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
  }, [audioPower, bass, currentTime, lines, lowMid, mid, paused, treble, vocal]);

  return { audioBands, audioPower, currentLineIndex, currentTime, lines };
}
