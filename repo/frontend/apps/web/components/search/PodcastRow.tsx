"use client";

import { Pause, Play, Radio } from "lucide-react";
import Image from "next/image";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { PodcastContextMenu } from "@/components/shared/PodcastContextMenu";
import { TableCell, TableRow } from "@/components/ui/table";
import { usePodcastPlay } from "@/hooks/library/usePodcastPlay";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getPodcastDestination } from "@/lib/search/podcastDestination";
import { cn, formatPlayCount } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { PodcastRowProps } from "@/types/components/search";
export function PodcastRow({ index, podcast }: PodcastRowProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const { handlePlayPodcast, loadingPodcastId } = usePodcastPlay();
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const isVoiceList = podcast.source === "voice-list";
  const isActive =
    currentSongDetail?.al?.id === podcast.id || String(playlistId) === `radio:${podcast.id}`;
  const isLoading = loadingPodcastId === podcast.id;
  const handleNavigate = () => router.push(getPodcastDestination(podcast));
  const row = (
    <TableRow
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        handleNavigate();
      }}
      className="group cursor-pointer border-none transition-colors duration-150 select-none hover:bg-content/10"
    >
      <TableCell className="rounded-l-md py-1.5 text-center text-xs text-content-subtle tabular-nums">
        {isVoiceList ? (
          <span>{String(index + 1).padStart(2, "0")}</span>
        ) : (
          <>
            {isActive && isPlaying ? (
              <div className="flex items-center justify-center group-hover:hidden">
                <PlayingAnimation className="h-3.5" />
              </div>
            ) : isActive ? (
              <Play className="mx-auto size-3.5 fill-current text-brand group-hover:hidden" />
            ) : (
              <span className="group-hover:hidden">{String(index + 1).padStart(2, "0")}</span>
            )}
            <div className="hidden items-center justify-center group-hover:flex">
              {isActive && isPlaying ? (
                <button
                  type="button"
                  title={t("contextMenu.pause")}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPlaying(false);
                  }}
                  className="inline-flex items-center justify-center text-brand transition-transform hover:scale-110"
                >
                  <Pause className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  title={t("contextMenu.play")}
                  onClick={(event) => void handlePlayPodcast(podcast.id, event)}
                  className="inline-flex items-center justify-center text-content transition-transform hover:scale-110"
                >
                  <Play
                    className={cn(
                      "size-3.5 fill-current",
                      isActive ? "text-brand" : "text-content",
                      isLoading && "animate-pulse",
                    )}
                  />
                </button>
              )}
            </div>
          </>
        )}
      </TableCell>
      <TableCell className="py-1.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface-elevated">
            {podcast.coverUrl ? (
              <Image
                width={80}
                height={80}
                src={podcast.coverUrl}
                alt={podcast.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-content-subtle">
                <Radio className="size-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-medium group-hover:underline",
                isActive ? "text-brand" : "text-content",
              )}
            >
              {podcast.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-content-subtle">
              {podcast.hostName || t("search.podcast.unknownHost")}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden py-1.5 text-sm text-content-muted md:table-cell">
        <span className="block truncate" title={podcast.category}>
          {podcast.category || "-"}
        </span>
      </TableCell>
      <TableCell className="hidden py-1.5 text-right text-sm tabular-nums md:table-cell">
        {podcast.score !== undefined ? (
          <span className="inline-flex min-w-10 justify-center rounded-sm border border-warning/50 bg-warning/10 px-1.5 py-0.5 text-xs font-semibold text-warning">
            {podcast.score}
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="hidden py-1.5 text-right text-sm tabular-nums sm:table-cell">
        {formatPlayCount(podcast.subscriberCount)}
      </TableCell>
      <TableCell className="hidden rounded-r-md py-1.5 text-right text-sm tabular-nums sm:table-cell">
        {podcast.programCount}
      </TableCell>
    </TableRow>
  );
  return (
    <PodcastContextMenu
      isActive={isActive}
      isPlaying={isPlaying}
      onPause={() => setIsPlaying(false)}
      podcast={podcast}
      onPlay={() => handlePlayPodcast(podcast.id)}
    >
      {row}
    </PodcastContextMenu>
  );
}
