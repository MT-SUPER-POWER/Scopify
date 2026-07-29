"use client";

import { Headphones, Pause, Play, Radio } from "lucide-react";
import Image from "next/image";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { PodcastContextMenu } from "@/components/shared/PodcastContextMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { usePodcastPlay } from "@/hooks/library/usePodcastPlay";
import { cn, formatDate, formatPlayCount } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SubscribedPodcastTableProps } from "@/types/components/library";

export function SubscribedPodcastTable({ podcasts }: SubscribedPodcastTableProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const { handlePlayPodcast, loadingPodcastId } = usePodcastPlay();

  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const storePlaylistId = usePlayerStore((s) => s.playlistId);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  return (
    <Table containerClassName="overflow-x-auto" className="w-full table-fixed text-zinc-400">
      <TableHeader className="border-b border-white/5">
        <TableRow className="border-none hover:bg-transparent">
          <TableHead className="w-12 text-center text-zinc-400">#</TableHead>
          <TableHead className="text-zinc-400">{t("library.podcasts.column.title")}</TableHead>
          <TableHead className="hidden w-56 text-zinc-400 lg:table-cell">
            {t("library.podcasts.recentPlay")}
          </TableHead>
          <TableHead className="hidden w-28 text-right text-zinc-400 sm:table-cell">
            {t("library.podcasts.column.playCount")}
          </TableHead>
          <TableHead className="hidden w-24 text-right text-zinc-400 sm:table-cell">
            {t("library.podcasts.column.voiceCount")}
          </TableHead>
          <TableHead className="hidden w-28 text-right text-zinc-400 lg:table-cell">
            {t("library.podcasts.column.updatedAt")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {podcasts.map((podcast, index) => {
          const categories = [podcast.category, podcast.secondCategory].filter(Boolean).join(" · ");
          const isLoading = loadingPodcastId === podcast.id;
          const lastUpdatedAt = podcast.lastProgramCreateTime ?? podcast.createTime;
          const isActive =
            currentSongDetail?.al?.id === podcast.id ||
            String(storePlaylistId) === `radio:${podcast.id}` ||
            String(storePlaylistId) === String(podcast.id);

          const row = (
            <TableRow
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/radio?id=${podcast.id}`)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                router.push(`/radio?id=${podcast.id}`);
              }}
              className="group cursor-pointer border-none transition-colors duration-150 select-none hover:bg-white/10"
            >
              <TableCell className="rounded-l-md py-1.5 text-center text-xs text-zinc-500 tabular-nums">
                {isActive && isPlaying ? (
                  <div className="flex items-center justify-center group-hover:hidden">
                    <PlayingAnimation className="h-3.5" />
                  </div>
                ) : isActive && !isPlaying ? (
                  <Play className="mx-auto size-3.5 fill-current text-[#1ed760] group-hover:hidden" />
                ) : (
                  <span className="group-hover:hidden">{String(index + 1).padStart(2, "0")}</span>
                )}

                <div className="hidden items-center justify-center group-hover:flex">
                  {isActive && isPlaying ? (
                    <button
                      type="button"
                      title={t("contextMenu.pause")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(false);
                      }}
                      className="inline-flex items-center justify-center text-[#1ed760] transition-transform hover:scale-110"
                    >
                      <Pause className="size-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title={t("common.action.play")}
                      onClick={(e) => handlePlayPodcast(podcast.id, e)}
                      className="inline-flex items-center justify-center text-white transition-transform hover:scale-110"
                    >
                      <Play
                        className={cn(
                          "size-3.5 fill-current",
                          isActive ? "text-[#1ed760]" : "text-white",
                          isLoading && "animate-pulse",
                        )}
                      />
                    </button>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-1.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-zinc-800">
                    {podcast.picUrl ? (
                      <Image
                        width={80}
                        height={80}
                        src={podcast.picUrl}
                        alt={podcast.name || "podcast"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-zinc-500">
                        <Radio className="size-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate font-medium group-hover:underline",
                        isActive ? "text-[#1ed760]" : "text-white",
                      )}
                    >
                      {podcast.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {[podcast.dj?.nickname, categories].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden py-1.5 lg:table-cell">
                {podcast.latestEpisodeName ? (
                  <span className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-300">
                    <Headphones className="size-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate" title={podcast.latestEpisodeName}>
                      {podcast.latestEpisodeName}
                    </span>
                  </span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </TableCell>
              <TableCell className="hidden py-1.5 text-right text-sm tabular-nums sm:table-cell">
                {formatPlayCount(podcast.playCount ?? 0)}
              </TableCell>
              <TableCell className="hidden py-1.5 text-right text-sm tabular-nums sm:table-cell">
                {podcast.programCount ?? 0}
              </TableCell>
              <TableCell className="hidden rounded-r-md py-1.5 text-right text-sm tabular-nums lg:table-cell">
                {lastUpdatedAt ? formatDate(lastUpdatedAt) : "-"}
              </TableCell>
            </TableRow>
          );

          return (
            <PodcastContextMenu
              key={podcast.id}
              isActive={isActive}
              isFavorited
              isPlaying={isPlaying}
              onPause={() => setIsPlaying(false)}
              podcast={podcast}
              onPlay={() => void handlePlayPodcast(podcast.id)}
            >
              {row}
            </PodcastContextMenu>
          );
        })}
      </TableBody>
    </Table>
  );
}
