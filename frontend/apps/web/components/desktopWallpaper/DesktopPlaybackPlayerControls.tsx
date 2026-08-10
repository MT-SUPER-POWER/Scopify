"use client";

import { Music2, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

import { FoliaPlaybackProgressBar } from "@/components/desktopWallpaper/FoliaPlaybackProgressBar";
import { useI18n } from "@/store/module/i18n";
import type { DesktopPlaybackPlayerControlsProps } from "@/types/components/desktopPlaybackWallpaper";

const transportButtonClass =
  "desktop-controller-soft-button flex size-8 items-center justify-center rounded-full transition disabled:pointer-events-none disabled:opacity-35";
const LYRIC_REVEAL_DELAY_MS = 800;

export function DesktopPlaybackPlayerControls({
  activeLyric,
  currentSong,
  desktopControl,
  durationMs,
  isPlaying,
  onNext,
  onPrevious,
  onSeek,
  onTogglePlaying,
  onVolumeChange,
  positionMs,
  track,
  volume,
}: DesktopPlaybackPlayerControlsProps) {
  const { t } = useI18n();
  const [isControlAreaHovered, setIsControlAreaHovered] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const artworkUrl =
    currentSong?.al.coverUrl ??
    currentSong?.al.picUrl ??
    currentSong?.al.blurPicUrl ??
    track?.artworkUrl;
  const title = currentSong?.name ?? track?.title ?? t("desktopPlaybackController.noTrack");
  const artistNames =
    currentSong?.ar.map((artist) => artist.name).join(" / ") ?? track?.artistNames.join(" / ");
  const showLyricView = showLyrics && Boolean(activeLyric?.primary);

  useEffect(() => {
    if (isControlAreaHovered) {
      setShowLyrics(false);
      return;
    }

    const timer = window.setTimeout(() => setShowLyrics(true), LYRIC_REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isControlAreaHovered]);

  return (
    <section className="grid w-full grid-cols-[112px_minmax(0,1fr)] items-center gap-4 [-webkit-app-region:no-drag]">
      <div className="desktop-controller-cover relative size-28 shrink-0 overflow-hidden rounded-xl bg-cover bg-center shadow-md">
        {artworkUrl ? (
          <div
            aria-label={track?.albumTitle ?? currentSong?.al.name}
            className="size-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url("${artworkUrl}")` }}
          />
        ) : (
          <div className="desktop-controller-muted flex size-full items-center justify-center">
            <Music2 className="size-8 opacity-45" />
          </div>
        )}
      </div>

      <div className="flex min-h-28 min-w-0 flex-col justify-between">
        <div className="min-w-0 pr-16">
          <div className="min-w-0 truncate text-[15px] leading-5 font-bold tracking-[-0.01em]">
            {title}
          </div>
          <div className="desktop-controller-muted mt-0.5 truncate text-xs font-medium">
            {artistNames || t("common.meta.unknownArtist")}
          </div>
        </div>

        <FoliaPlaybackProgressBar
          ariaLabel={t("desktopPlaybackController.playbackProgress")}
          durationMs={durationMs}
          onSeek={onSeek}
          positionMs={positionMs}
        />

        <div
          className="relative min-h-9 w-full"
          onMouseEnter={() => setIsControlAreaHovered(true)}
          onMouseLeave={() => setIsControlAreaHovered(false)}
        >
          {showLyricView ? (
            <div className="animate-in fade-in slide-in-from-bottom-1 absolute inset-0 flex min-w-0 flex-col justify-center duration-150">
              <div className="truncate text-base leading-5 font-bold">{activeLyric?.primary}</div>
              <div className="desktop-controller-muted mt-0.5 truncate text-[11px] leading-4 font-medium">
                {activeLyric?.secondary}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in absolute inset-0 flex items-center justify-between duration-150">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={t("ui.previous")}
                  className={transportButtonClass}
                  disabled={!currentSong && !track}
                  onClick={onPrevious}
                >
                  <SkipBack className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={t(isPlaying ? "ui.pause" : "ui.play")}
                  className="desktop-controller-primary-button flex size-9 items-center justify-center rounded-full transition disabled:pointer-events-none disabled:opacity-35"
                  disabled={!currentSong && !track}
                  onClick={onTogglePlaying}
                >
                  {isPlaying ? (
                    <Pause className="size-4 fill-current" />
                  ) : (
                    <Play className="ml-0.5 size-4 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t("ui.next")}
                  className={transportButtonClass}
                  disabled={!currentSong && !track}
                  onClick={onNext}
                >
                  <SkipForward className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="desktop-controller-muted flex items-center gap-1.5">
                  <Volume2 className="size-3.5 shrink-0" />
                  <input
                    type="range"
                    aria-label={t("ui.volume")}
                    className="desktop-controller-range w-14 cursor-pointer"
                    max={100}
                    min={0}
                    onChange={(event) => onVolumeChange(Number(event.currentTarget.value))}
                    step={1}
                    value={Math.round(volume)}
                  />
                </label>
                {desktopControl}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
