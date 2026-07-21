"use client";

import { useMemo } from "react";

import type { LyricData } from "@/types/lyrics";

import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { findActiveLyricLineIndex } from "@/lib/lyrics/timeline";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";

import { useLyricPlaybackClock } from "./useLyricPlaybackClock";

export interface LyricStageData {
  activeLineIndex: number;
  currentTimeMs: number;
  isPlaying: boolean;
  lyrics: LyricData | null;
}

export function useLyricStageData(): LyricStageData {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const rawLyric = usePlayerStore((state) => state.lyric);
  const storedTimeMs = useTimeStore((state) => state.currentTime);
  const currentTimeMs = useLyricPlaybackClock({ initialTimeMs: storedTimeMs, isPlaying });
  const lyrics = useMemo(() => (rawLyric ? adaptNeteaseLyric(rawLyric) : null), [rawLyric]);

  return {
    activeLineIndex: lyrics ? findActiveLyricLineIndex(lyrics.lines, currentTimeMs) : -1,
    currentTimeMs,
    isPlaying,
    lyrics,
  };
}
