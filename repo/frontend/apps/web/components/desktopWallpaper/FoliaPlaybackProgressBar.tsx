"use client";

import { PlaybackProgressBar } from "@/components/PlayBar/PlaybackProgressBar";
import type { FoliaPlaybackProgressBarProps } from "@/types/components/desktopPlaybackWallpaper";

export function FoliaPlaybackProgressBar({
  ariaLabel,
  durationMs,
  onSeek,
  positionMs,
}: FoliaPlaybackProgressBarProps) {
  return (
    <PlaybackProgressBar
      ariaLabel={ariaLabel}
      durationMs={durationMs}
      onSeek={(nextPositionMs) => onSeek(nextPositionMs)}
      positionMs={positionMs}
      variant="folia"
    />
  );
}
