import { memo, useCallback, useState } from "react";
import { PlaybackProgressBar } from "@/components/PlayBar/PlaybackProgressBar";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  usePlaybackPosition as usePlaybackPositionMs,
  usePlaybackProjection,
} from "@/hooks/player/usePlaybackProjection";
import { useProgressChorusMarker } from "@/hooks/player/useProgressChorusMarker";
import { useTimeStore } from "@/store/module/time";

export const PlayerProgressBar = memo(() => {
  const playback = usePlaybackProjection();
  const positionMs = usePlaybackPositionMs();
  const commands = usePlaybackCommands();
  const bufferedTime = useTimeStore((s) => s.bufferedTime);
  const [previewPositionMs, setPreviewPositionMs] = useState<number | null>(null);
  const currentSongId = playback.track?.id ?? null;
  const { chorusMarkerFraction, chorusRanges } = useProgressChorusMarker({
    durationMs: playback.durationMs,
    songId: currentSongId,
  });

  const handleSeek = useCallback(
    (newTimeMs: number, isCommit: boolean) => {
      if (!isCommit) {
        setPreviewPositionMs(newTimeMs);
        return;
      }

      setPreviewPositionMs(newTimeMs);
      void commands.seek(newTimeMs).finally(() => setPreviewPositionMs(null));
    },
    [commands],
  );

  return (
    <PlaybackProgressBar
      bufferedPositionMs={bufferedTime}
      chorusMarkerFraction={chorusMarkerFraction}
      durationMs={playback.durationMs}
      onSeek={handleSeek}
      positionMs={previewPositionMs ?? positionMs}
      rangeMarkers={chorusRanges}
    />
  );
});

PlayerProgressBar.displayName = "PlayerProgressBar";
