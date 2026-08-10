import { memo, useCallback, useMemo, useState } from "react";
import { PlaybackProgressBar } from "@/components/PlayBar/PlaybackProgressBar";
import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  usePlaybackPosition as usePlaybackPositionMs,
  usePlaybackProjection,
} from "@/hooks/player/usePlaybackProjection";
import { getChorusProgressRanges } from "@/lib/player/chorusMarkers";
import { useTimeStore } from "@/store/module/time";

export const PlayerProgressBar = memo(() => {
  const playback = usePlaybackProjection();
  const positionMs = usePlaybackPositionMs();
  const commands = usePlaybackCommands();
  const bufferedTime = useTimeStore((s) => s.bufferedTime);
  const [previewPositionMs, setPreviewPositionMs] = useState<number | null>(null);
  const currentSongId = playback.track?.id ?? null;
  const chorusQuery = useSongChorus(currentSongId);
  const chorusRanges = useMemo(
    () => getChorusProgressRanges(chorusQuery.data ?? [], playback.durationMs),
    [chorusQuery.data, playback.durationMs],
  );

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
      durationMs={playback.durationMs}
      onSeek={handleSeek}
      positionMs={previewPositionMs ?? positionMs}
      rangeMarkers={chorusRanges}
    />
  );
});

PlayerProgressBar.displayName = "PlayerProgressBar";
