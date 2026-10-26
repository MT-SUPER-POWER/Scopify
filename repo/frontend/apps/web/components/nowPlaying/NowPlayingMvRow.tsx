"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn, formatDuration, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingMvRowProps } from "@/types/components/nowPlaying";

/** MV 卡片中的一行：16:9 缩略图、时长、标题与播放量，点击在面板封面位播放。 */
export function NowPlayingMvRow({ mv, isActive, isSongMv, onSelect }: NowPlayingMvRowProps) {
  const { t } = useI18n();
  const cover = mv.imgurl16v9 || mv.cover || mv.imgurl || mv.picUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(mv.id)}
      aria-current={isActive || undefined}
      className="group mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-content/5"
    >
      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded bg-surface-elevated">
        {cover && (
          <Image
            fill
            sizes="112px"
            src={getSizedImageUrl(cover, 240)}
            alt=""
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <Play className="absolute inset-0 m-auto size-5 fill-white text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
        {mv.duration ? (
          <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[10px] leading-4 text-white tabular-nums">
            {formatDuration(mv.duration)}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "line-clamp-2 text-sm leading-5 font-medium",
            isActive ? "text-brand" : "text-content",
          )}
        >
          {mv.name}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-content-muted">
          {isSongMv && (
            <span className="shrink-0 rounded-sm bg-content/10 px-1 text-[10px] leading-4 font-bold text-content">
              {t("nowPlaying.songMv")}
            </span>
          )}
          {mv.playCount ? <span className="truncate">{formatPlayCount(mv.playCount)}</span> : null}
        </span>
      </span>
    </button>
  );
}
