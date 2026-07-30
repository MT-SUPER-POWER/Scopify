"use client";

import { useEffect, useMemo, useState } from "react";

import type { DesktopLyricSnapshot } from "@/types/desktopLyric";
import type { LyricDisplayLine } from "@/types/lyrics";

import { findActiveLyricLineIndex } from "@/lib/lyrics/timeline";

interface DesktopLyricRuntime {
  activeLine: LyricDisplayLine | null;
  currentTimeMs: number;
  nextLine: LyricDisplayLine | null;
  snapshot: DesktopLyricSnapshot | null;
}

export function useDesktopLyricSnapshot(): DesktopLyricRuntime {
  const [snapshot, setSnapshot] = useState<DesktopLyricSnapshot | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    void window.electronAPI?.getDesktopLyricSnapshot().then(setSnapshot);
    return window.electronAPI?.onDesktopLyricSnapshot(setSnapshot);
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const tick = () => {
      setNow(Date.now());
      animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return useMemo(() => {
    const currentTimeMs = snapshot
      ? snapshot.positionMs + (snapshot.isPlaying ? now - snapshot.updatedAt : 0)
      : 0;
    const lines = snapshot?.lyrics?.lines ?? [];
    const activeIndex = findActiveLyricLineIndex(lines, currentTimeMs);
    return {
      activeLine: activeIndex >= 0 ? lines[activeIndex] : null,
      currentTimeMs,
      nextLine: activeIndex >= 0 ? (lines[activeIndex + 1] ?? null) : (lines[0] ?? null),
      snapshot,
    };
  }, [now, snapshot]);
}
