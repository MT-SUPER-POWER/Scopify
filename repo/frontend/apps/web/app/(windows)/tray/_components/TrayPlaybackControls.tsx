"use client";

import { Heart, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TrayPlaybackControlsProps } from "@/types/desktop/trayComponents";

export function TrayPlaybackControls({
  isPlaying,
  liked,
  onPrevious,
  onTogglePlay,
  onNext,
  onToggleLike,
}: TrayPlaybackControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center justify-between px-4 py-1">
      <button
        className="rounded-full p-1.5 text-content-muted transition-all hover:bg-surface-elevated hover:text-content"
        onClick={onPrevious}
        title={t("tray.previous")}
      >
        <SkipBack className="size-5 fill-current" />
      </button>

      <button
        className="rounded-full p-2 text-content-muted transition-all hover:bg-surface-elevated hover:text-content"
        onClick={onTogglePlay}
        title={isPlaying ? t("tray.pause") : t("tray.play")}
      >
        {/* 修复：这里正确判断并显示 Pause 或 Play 图标 */}
        {isPlaying ? (
          <Pause className="size-6 fill-current" />
        ) : (
          <Play className="size-6 fill-current" />
        )}
      </button>

      <button
        className="rounded-full p-1.5 text-content-muted transition-all hover:bg-surface-elevated hover:text-content"
        onClick={onNext}
        title={t("tray.next")}
      >
        <SkipForward className="size-5 fill-current" />
      </button>
      <button
        className={`rounded-full p-1.5 transition-all ${liked ? "text-brand" : "text-content-muted hover:bg-surface-elevated hover:text-content"}`}
        onClick={onToggleLike}
        title={liked ? t("tray.unlike") : t("tray.like")}
      >
        <Heart className={`size-6 ${liked ? "fill-brand" : ""}`} />
      </button>
    </div>
  );
}
