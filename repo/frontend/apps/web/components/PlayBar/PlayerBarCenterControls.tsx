"use client";

import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { PlayerProgressBar } from "@/components/PlayBar/ProgressBar";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export interface PlayerBarCenterControlsProps {
  isLyricStageBar?: boolean;
}

export function PlayerBarCenterControls({ isLyricStageBar = false }: PlayerBarCenterControlsProps) {
  const { t } = useI18n();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();

  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const isPlaying = playback.isPlaying;

  // 切换播放模式
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };
  const shuffleModeLabel = t(isShuffle ? "ui.shuffleOn" : "ui.shuffleOff");
  const repeatModeLabel = t(
    repeatMode === "one" ? "ui.repeatOne" : repeatMode === "all" ? "ui.repeatAll" : "ui.repeatOff",
  );
  const playbackActionLabel = t(isPlaying ? "ui.pause" : "ui.play");

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1.5",
        isLyricStageBar
          ? "w-[clamp(280px,40vw,560px)]"
          : "flex-2 md:w-[clamp(280px,40vw,560px)] md:flex-none",
      )}
    >
      <TooltipProvider>
        <div className="mt-1 flex items-center gap-4 lg:gap-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={shuffleModeLabel}
                onClick={toggleShuffle}
                className={cn(
                  "relative hidden transition-colors sm:block",
                  isShuffle ? "text-brand" : "text-content-muted hover:text-content",
                  "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-brand after:content-['']",
                  isShuffle ? "after:opacity-100" : "after:opacity-0",
                )}
              >
                <Shuffle className="size-4 lg:size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {shuffleModeLabel}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("ui.previous")}
                onClick={() => void commands.previous()}
                className="text-content-muted transition-colors hover:text-content"
              >
                <SkipBack className="size-4 fill-current lg:size-5" />
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
                onClick={() => void commands.toggle()}
                disabled={!playback.canControl}
                className="flex size-9 items-center justify-center rounded-full bg-content text-surface transition-all hover:scale-105 hover:bg-content/90 active:scale-95 disabled:opacity-40 lg:size-10"
              >
                {isPlaying ? (
                  <Pause className="size-4 fill-current lg:size-5" />
                ) : (
                  <Play className="size-4 fill-current lg:size-5" />
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
                onClick={() => void commands.next()}
                className="text-content-muted transition-colors hover:text-content"
              >
                <SkipForward className="size-4 fill-current lg:size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <ShortcutHint commandId="next-track" label={t("ui.next")} />
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={repeatModeLabel}
                onClick={cycleRepeat}
                className={cn(
                  "relative hidden transition-colors sm:block",
                  repeatMode !== "off" ? "text-brand" : "text-content-muted hover:text-content",
                  "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-brand after:content-['']",
                  repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0",
                )}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="size-4 lg:size-5" />
                ) : (
                  <Repeat className="size-4 lg:size-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {repeatModeLabel}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div className="hidden h-4 w-full sm:flex">
        <PlayerProgressBar />
      </div>
    </div>
  );
}
