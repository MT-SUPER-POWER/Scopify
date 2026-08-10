"use client";

import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { DesktopPlaybackPlayerControlsProps } from "@/types/components/desktopPlaybackWallpaper";

const transportButtonClass =
  "flex size-10 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-overlay hover:text-content disabled:pointer-events-none disabled:opacity-35";

export function DesktopPlaybackPlayerControls({
  currentSong,
  isConnected,
  isPlaying,
  onNext,
  onPrevious,
  onTogglePlaying,
  onVolumeChange,
  volume,
}: DesktopPlaybackPlayerControlsProps) {
  const { t } = useI18n();
  const artworkUrl =
    currentSong?.al.coverUrl ?? currentSong?.al.picUrl ?? currentSong?.al.blurPicUrl;
  const artistNames = currentSong?.ar.map((artist) => artist.name).join(" / ");

  return (
    <section className="border-border border-b px-5 py-4">
      <div className="mb-4 flex min-w-0 items-center gap-3">
        <div
          aria-hidden
          className="bg-surface-overlay size-14 shrink-0 bg-cover bg-center shadow-sm"
          style={artworkUrl ? { backgroundImage: `url("${artworkUrl}")` } : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="text-content truncate text-sm font-semibold">
            {currentSong?.name ?? t("desktopPlaybackController.noTrack")}
          </div>
          <div className="text-content-muted mt-1 truncate text-xs">
            {artistNames || t("common.meta.unknownArtist")}
          </div>
        </div>
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            isConnected ? "bg-emerald-500" : "bg-content-muted/40",
          )}
        />
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={t("ui.previous")}
          className={transportButtonClass}
          disabled={!currentSong}
          onClick={onPrevious}
        >
          <SkipBack className="size-5 fill-current" />
        </button>
        <button
          type="button"
          aria-label={t(isPlaying ? "ui.pause" : "ui.play")}
          className="bg-content text-surface hover:bg-content/90 flex size-12 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-35"
          disabled={!currentSong}
          onClick={onTogglePlaying}
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="ml-0.5 size-5 fill-current" />
          )}
        </button>
        <button
          type="button"
          aria-label={t("ui.next")}
          className={transportButtonClass}
          disabled={!currentSong}
          onClick={onNext}
        >
          <SkipForward className="size-5 fill-current" />
        </button>
      </div>

      <div className="mt-4">
        <div className="text-content-muted mb-2 flex items-center justify-between text-xs">
          <span>{t("ui.volume")}</span>
          <span className="tabular-nums">{Math.round(volume)}%</span>
        </div>
        <label className="text-content-muted flex items-center gap-3">
          <Volume2 className="size-4 shrink-0" />
          <input
            type="range"
            aria-label={t("ui.volume")}
            className="accent-brand h-1.5 min-w-0 flex-1 cursor-pointer"
            max={100}
            min={0}
            onChange={(event) => onVolumeChange(Number(event.currentTarget.value))}
            step={1}
            value={Math.round(volume)}
          />
        </label>
      </div>
    </section>
  );
}
