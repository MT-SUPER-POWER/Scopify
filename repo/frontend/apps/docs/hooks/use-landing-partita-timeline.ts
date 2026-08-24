"use client";

import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { LANDING_PARTITA_ANIMATION_DURATION } from "@/constants/marketing";
import {
  LANDING_PARTITA_LINES,
  resolvePartitaIntroTime,
} from "@/lib/marketing/folia-partita-timeline";
import { resolveVisualBeat } from "@/lib/marketing/folia-sonnet-timeline";
import type { LandingPartitaTimeline } from "@/types/marketing";

export function useLandingPartitaTimeline(
  active: boolean,
  reducedMotion: boolean,
): LandingPartitaTimeline {
  const currentTime = useMotionValue(0);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const [isSettled, setIsSettled] = useState(false);
  const hasStartedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const audioBands = useMemo(
    () => ({ bass, lowMid, mid, vocal, treble }),
    [bass, lowMid, mid, vocal, treble],
  );

  useEffect(() => {
    if (!active || hasStartedRef.current) return;
    hasStartedRef.current = true;

    if (reducedMotion) {
      currentTime.set(LANDING_PARTITA_ANIMATION_DURATION);
      return;
    }

    const startedAt = performance.now();
    const update = (now: number) => {
      const time = resolvePartitaIntroTime((now - startedAt) / 1000);
      const beat = resolveVisualBeat(time);

      currentTime.set(time);
      audioPower.set(beat.power);
      bass.set(beat.bass);
      lowMid.set(beat.lowMid);
      mid.set(beat.mid);
      vocal.set(beat.vocal);
      treble.set(beat.treble);

      if (time < LANDING_PARTITA_ANIMATION_DURATION) {
        animationFrameRef.current = requestAnimationFrame(update);
        return;
      }

      audioPower.set(0);
      bass.set(0);
      lowMid.set(0);
      mid.set(0);
      vocal.set(0);
      treble.set(0);
      animationFrameRef.current = null;
      setIsSettled(true);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  }, [active, audioPower, bass, currentTime, lowMid, mid, reducedMotion, treble, vocal]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  return {
    audioBands,
    audioPower,
    currentLineIndex: 0,
    currentTime,
    isSettled: reducedMotion || isSettled,
    lines: LANDING_PARTITA_LINES,
  };
}
