"use client";

import { usePlaybackPositionMs } from "@/hooks/player/usePlaybackProjection";
import { computeCompanionLyricProgress } from "@/lib/lyrics/companionLyricProgress";
import { applyLyricOffsetMs } from "@/lib/lyrics/timeline";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Line } from "@/components/lyrics/folia/src/types";

/** Only the glyph renderer subscribes to frame-by-frame playback progress. */
export function useCompanionLyricProgress(line?: Line) {
  const positionMs = usePlaybackPositionMs(Boolean(line));
  const offsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  return line
    ? computeCompanionLyricProgress(line, applyLyricOffsetMs(positionMs, offsetMs) / 1_000)
    : undefined;
}
