"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { TaskbarLyricControlsProps } from "@/types/desktop/taskbarLyric";

const BUTTON_CLASS =
  "flex aspect-square h-full shrink-0 items-center justify-center rounded-md border border-(--tbl-primary)/25 transition-[background-color,transform] duration-300 hover:bg-(--tbl-primary)/15 active:scale-90";

/** 悬停时从封面旁展开的上一首 / 播放暂停 / 下一首。 */
export function TaskbarLyricControls({ visible }: TaskbarLyricControlsProps) {
  const { t } = useTranslation();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();

  return (
    <div
      className={cn(
        "flex shrink-0 self-stretch overflow-hidden transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "max-w-48" : "pointer-events-none max-w-0",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 p-1 transition-opacity duration-200",
          visible ? "opacity-100 delay-100" : "opacity-0",
        )}
      >
        <button
          type="button"
          aria-label={t("desktopLyrics.previous")}
          onClick={() => void commands.previous()}
          className={BUTTON_CLASS}
        >
          <SkipBack className="size-3.5 fill-current" />
        </button>
        <button
          type="button"
          aria-label={t("desktopLyrics.playPause")}
          onClick={() => void commands.toggle()}
          className={BUTTON_CLASS}
        >
          {playback.isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </button>
        <button
          type="button"
          aria-label={t("desktopLyrics.next")}
          onClick={() => void commands.next()}
          className={BUTTON_CLASS}
        >
          <SkipForward className="size-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
