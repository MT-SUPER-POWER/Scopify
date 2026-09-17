"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import { useSubtitlePlaybackPosition } from "@/hooks/settings/useSubtitlePlaybackPosition";
import { useI18n } from "@/store/module/i18n";
import type { SubtitlePlaybackControlsProps } from "@/types/subtitle-preview";
import { AppearanceRange } from "./AppearanceRange";

export function SubtitlePlaybackControls({
  playback,
  duration,
  loop,
  onTogglePlayback,
  onSeek,
}: SubtitlePlaybackControlsProps) {
  const { t } = useI18n();
  const position = useSubtitlePlaybackPosition(playback, duration, loop);
  const playing = playback.startedAt !== null && (loop || position < duration);
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onTogglePlayback}>
        {t(playing ? "subtitleSystem.pause" : "subtitleSystem.play")}
      </Button>
      <AppearanceRange
        label={t("subtitleSystem.progress")}
        value={Math.round((position / duration) * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={onSeek}
      />
    </div>
  );
}
