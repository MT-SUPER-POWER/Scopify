"use client";

import { useMemo } from "react";

import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import {
  findSourceChorusStartSec,
  getChorusMarkerFraction,
  getChorusProgressRanges,
} from "@/lib/player/chorusMarkers";
import { useLyricStageStore } from "@/store/module/lyrics";
import type {
  UseProgressChorusMarkerOptions,
  UseProgressChorusMarkerResult,
} from "@/types/player/foliaControls";

export function useProgressChorusMarker({
  durationMs,
  enabled = true,
  lyrics = null,
  songId,
}: UseProgressChorusMarkerOptions): UseProgressChorusMarkerResult {
  const markerEnabled = useLyricStageStore((state) => state.progressBarChorusMarker) && enabled;
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const chorusQuery = useSongChorus(markerEnabled ? songId : null);

  return useMemo(() => {
    if (!markerEnabled) {
      return { chorusMarkerFraction: null, chorusRanges: [] };
    }
    const ranges = chorusQuery.data ?? [];
    const usesLyricClock = Boolean(lyrics && lyrics.lines.length > 0);
    const chorusStartSec = findSourceChorusStartSec(lyrics, ranges);
    return {
      chorusMarkerFraction: getChorusMarkerFraction(
        chorusStartSec,
        usesLyricClock ? lyricOffsetMs : 0,
        durationMs / 1_000,
      ),
      chorusRanges: getChorusProgressRanges(ranges, durationMs),
    };
  }, [chorusQuery.data, durationMs, lyricOffsetMs, lyrics, markerEnabled]);
}
