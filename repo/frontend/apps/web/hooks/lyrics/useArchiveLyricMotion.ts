"use client";

import { useLayoutEffect, useRef } from "react";
import { useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import type { ArchiveLyricMotionOptions } from "@/types/archiveLyrics";

export function useArchiveLyricMotion({ identity, paused, staticMode }: ArchiveLyricMotionOptions) {
  const reducedMotion = useReducedMotion();
  const instant = staticMode || Boolean(reducedMotion);
  const reveal = useMotionValue(1);
  const elapsed = useRef(1);
  const observed = useRef<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (observed.current === identity && !instant) return;
    observed.current = identity;
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    // A seek while paused should reveal its destination immediately. Pausing an
    // existing reveal leaves it at exactly its current position.
    elapsed.current = instant || paused ? 1 : 0;
    reveal.set(elapsed.current);
  }, [identity, instant, paused, reveal]);

  useAnimationFrame((_, delta) => {
    if (paused || instant || document.hidden || elapsed.current >= 1) return;
    elapsed.current = Math.min(1, elapsed.current + Math.min(delta, 50) / 680);
    const amount = 1 - (1 - elapsed.current) ** 3;
    reveal.set(amount);
  });

  return {
    viewportRef,
    clipPath: useTransform(reveal, (value) => `inset(0 ${(1 - value) * 100}% 0 0)`),
    y: useTransform(reveal, [0, 1], [12, 0]),
    opacity: useTransform(reveal, [0, 0.16, 1], [0, 1, 1]),
    reducedMotion: instant,
  };
}
