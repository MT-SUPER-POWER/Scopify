"use client";

import { CalendarDays, Headphones, ListMusic, Pause, Play, Radio, Users } from "lucide-react";
import Image from "next/image";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SubscribedPodcastCardProps } from "@/types/components/library";

export function SubscribedPodcastCard({
  isActive,
  isLoading,
  isPlaying,
  onPause,
  onPlay,
  podcast,
}: SubscribedPodcastCardProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const categoryLabel = [podcast.category, podcast.secondCategory].filter(Boolean).join(" · ");
  const lastUpdatedAt = podcast.lastProgramCreateTime ?? podcast.createTime;

  return (
    <div
      onClick={() => router.push(`/radio?id=${podcast.id}`)}
      className="group min-w-0 cursor-pointer rounded-md p-2.5 transition-colors hover:bg-white/5"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-800">
        {podcast.picUrl ? (
          <Image
            width={300}
            height={300}
            src={podcast.picUrl}
            alt={podcast.name || "podcast"}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-500">
            <Radio className="size-9" />
          </div>
        )}

        {isActive && isPlaying ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <PlayingAnimation size={24} />
          </div>
        ) : null}

        {categoryLabel ? (
          <span
            className="absolute top-2 right-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-black/65 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm"
            title={categoryLabel}
          >
            {categoryLabel}
          </span>
        ) : null}

        {isActive && isPlaying ? (
          <button
            type="button"
            onClick={onPause}
            title={t("contextMenu.pause")}
            aria-label={t("contextMenu.pause")}
            className="absolute right-2 bottom-2 flex size-12 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#3be477]"
          >
            <Pause className="size-6 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            title={t("common.action.play")}
            aria-label={t("common.action.play")}
            className="absolute right-2 bottom-2 flex size-12 translate-y-3 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-[#3be477]"
          >
            <Play className={cn("ml-0.5 size-6 fill-current", isLoading && "animate-pulse")} />
          </button>
        )}
      </div>

      <h2 className="mt-3 truncate text-sm font-semibold text-white">{podcast.name}</h2>
      {podcast.dj?.nickname ? (
        <p className="mt-1 truncate text-xs text-zinc-400">{podcast.dj.nickname}</p>
      ) : null}
      {podcast.latestEpisodeName ? (
        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-zinc-300">
          <Headphones className="size-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">
            {t("library.podcasts.recentPlay")} · {podcast.latestEpisodeName}
          </span>
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span className="flex items-center gap-1" title={t("library.podcasts.column.voiceCount")}>
          <ListMusic className="size-3.5 shrink-0" />
          {formatNumber(podcast.programCount ?? 0)}
        </span>
        <span
          className="flex items-center gap-1"
          title={t("library.podcasts.subscribers", { count: podcast.subCount ?? 0 })}
        >
          <Users className="size-3.5 shrink-0" />
          {formatNumber(podcast.subCount ?? 0)}
        </span>
        {lastUpdatedAt ? (
          <span className="flex items-center gap-1" title={t("library.podcasts.column.updatedAt")}>
            <CalendarDays className="size-3.5 shrink-0" />
            {formatDate(lastUpdatedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
