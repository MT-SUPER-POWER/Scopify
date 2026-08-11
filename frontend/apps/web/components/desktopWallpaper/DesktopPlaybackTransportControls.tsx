"use client";

import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";

import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/store/module/i18n";
import type { DesktopPlaybackTransportControlsProps } from "@/types/components/desktopPlaybackWallpaper";

const transportButtonClass =
  "desktop-controller-soft-button flex size-8 items-center justify-center rounded-full transition disabled:pointer-events-none disabled:opacity-35";

export function DesktopPlaybackTransportControls({
  desktopControl,
  hasTrack,
  isPlaying,
  onNext,
  onPrevious,
  onTogglePlaying,
  onVolumeChange,
  volume,
}: DesktopPlaybackTransportControlsProps) {
  const { t } = useI18n();
  const playbackActionLabel = t(isPlaying ? "ui.pause" : "ui.play");

  return (
    <TooltipProvider>
      <div className="animate-in fade-in absolute inset-0 flex items-center justify-between duration-150">
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("ui.previous")}
                className={transportButtonClass}
                disabled={!hasTrack}
                onClick={onPrevious}
              >
                <SkipBack className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <ShortcutHint commandId="previous-track" label={t("ui.previous")} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={playbackActionLabel}
                className="desktop-controller-primary-button flex size-9 items-center justify-center rounded-full transition disabled:pointer-events-none disabled:opacity-35"
                disabled={!hasTrack}
                onClick={onTogglePlaying}
              >
                {isPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="ml-0.5 size-4 fill-current" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <ShortcutHint commandId="toggle-playback" label={playbackActionLabel} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("ui.next")}
                className={transportButtonClass}
                disabled={!hasTrack}
                onClick={onNext}
              >
                <SkipForward className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <ShortcutHint commandId="next-track" label={t("ui.next")} />
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                data-shortcut-scope="volume"
                className="desktop-controller-muted flex items-center gap-1.5"
              >
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
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <div className="space-y-1.5">
                <span>{t("ui.volume")}</span>
                <p className="text-background/70 text-[10px]">{t("shortcuts.scope.volume")}</p>
                <ShortcutHint
                  commandId="increase-volume"
                  label={t("shortcuts.command.increaseVolume")}
                />
                <ShortcutHint
                  commandId="decrease-volume"
                  label={t("shortcuts.command.decreaseVolume")}
                />
              </div>
            </TooltipContent>
          </Tooltip>
          {desktopControl}
        </div>
      </div>
    </TooltipProvider>
  );
}
