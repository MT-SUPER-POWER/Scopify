"use client";

import { ArrowDown, ArrowUp, Volume2, VolumeX, X } from "lucide-react";
import { TrackPreviewActions } from "./TrackPreviewActions";
import { useI18n } from "@/store/module/i18n";
import type { TrackPreviewControlsProps } from "@/types/player/trackPreviewComponents";

const ICON_BTN =
  "flex size-10 items-center justify-center rounded-full text-content/85 transition-colors hover:bg-content/10 hover:text-content";

export function TrackPreviewControls({
  song,
  songs,
  playlistId,
  onClose,
  muted,
  onToggleMute,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: TrackPreviewControlsProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-between">
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.action.close")}
          className={ICON_BTN}
        >
          <X className="size-5" />
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={t(muted ? "trackPreview.unmute" : "trackPreview.mute")}
          aria-pressed={muted}
          className={ICON_BTN}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      <TrackPreviewActions song={song} songs={songs} playlistId={playlistId} onClose={onClose} />

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label={t("trackPreview.previous")}
          className={`${ICON_BTN} disabled:pointer-events-none disabled:opacity-30`}
        >
          <ArrowUp className="size-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label={t("trackPreview.next")}
          className="flex size-12 items-center justify-center rounded-full bg-content text-surface transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowDown className="size-5" />
        </button>
      </div>
    </div>
  );
}
