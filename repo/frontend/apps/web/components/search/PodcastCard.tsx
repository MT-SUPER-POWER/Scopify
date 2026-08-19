"use client";

import { ListMusic, Pause, Play, Radio } from "lucide-react";
import Image from "next/image";
import { PlayingIndicator } from "@scopify/ui/scopify/components/playing-indicator";
import { usePodcastPlay } from "@/hooks/library/usePodcastPlay";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getPodcastDestination } from "@/lib/search/podcastDestination";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { PodcastCardProps } from "@/types/components/search";
import { PodcastContextMenu } from "@/components/shared/PodcastContextMenu";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400&auto=format&fit=crop";

export function PodcastCard({ podcast }: PodcastCardProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const { handlePlayPodcast, loadingPodcastId } = usePodcastPlay();
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const isActive =
    currentSongDetail?.al?.id === podcast.id || String(playlistId) === `radio:${podcast.id}`;
  const categoryLabel = podcast.category;

  const handleNavigate = () => router.push(getPodcastDestination(podcast));

  const card = (
    <article
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        handleNavigate();
      }}
      className="group min-w-0 cursor-pointer rounded-xl bg-surface-elevated p-4 transition-colors hover:bg-surface-overlay"
    >
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md bg-surface-sunken shadow-panel">
        <Image
          width={300}
          height={300}
          src={podcast.coverUrl || FALLBACK_COVER}
          alt={podcast.name}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {categoryLabel && (
          <span
            className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-overlay/80 px-2 py-1 text-xs font-medium text-overlay-foreground backdrop-blur-sm"
            title={categoryLabel}
          >
            {categoryLabel}
          </span>
        )}
        {isActive && isPlaying ? (
          <div className="absolute inset-0 flex items-center justify-center bg-media-overlay">
            <PlayingIndicator size={24} />
          </div>
        ) : null}
        {isActive && isPlaying ? (
          <button
            type="button"
            title={t("contextMenu.pause")}
            aria-label={t("contextMenu.pause")}
            onClick={(event) => {
              event.stopPropagation();
              setIsPlaying(false);
            }}
            className="absolute right-2 bottom-2 flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all duration-300 hover:scale-105 hover:bg-brand-hover"
          >
            <Pause className="size-6 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            title={t("contextMenu.play")}
            aria-label={t("contextMenu.play")}
            onClick={(event) => void handlePlayPodcast(podcast.id, event)}
            className="absolute right-2 bottom-2 flex size-12 translate-y-3 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover focus-visible:translate-y-0 focus-visible:opacity-100"
          >
            <Play
              className={cn(
                "ml-0.5 size-6 fill-current",
                loadingPodcastId === podcast.id && "animate-pulse",
              )}
            />
          </button>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <h3 className="truncate text-base font-bold text-content">{podcast.name}</h3>
        {podcast.score !== undefined ? (
          <span
            className="inline-flex h-[13px] shrink-0 items-center rounded-xs border border-warning bg-warning/10 px-[2px] text-[9px] leading-[11px] font-normal text-warning"
            title={t("search.podcast.score", { score: podcast.score })}
          >
            <span className="sr-only">{t("search.podcast.score", { score: podcast.score })}</span>
            {podcast.score}
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate text-sm text-content-muted">
        {podcast.hostName || t("search.podcast.unknownHost")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-subtle">
        <span className="inline-flex items-center gap-1">
          <Radio className="size-3" />
          {t("search.podcast.subscriberCount", { count: podcast.subscriberCount })}
        </span>
        <span className="inline-flex items-center gap-1">
          <ListMusic className="size-3" />
          {t("search.podcast.programCount", { count: podcast.programCount })}
        </span>
      </div>
    </article>
  );

  return (
    <PodcastContextMenu
      isActive={isActive}
      isPlaying={isPlaying}
      onPause={() => setIsPlaying(false)}
      podcast={podcast}
      onPlay={() => handlePlayPodcast(podcast.id)}
    >
      {card}
    </PodcastContextMenu>
  );
}
