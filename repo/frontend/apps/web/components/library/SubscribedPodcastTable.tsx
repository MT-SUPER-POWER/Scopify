import { ChevronDown, ChevronUp, Headphones, Pause, Play, Radio } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
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

type PodcastSortKey = "title" | "playCount" | "voiceCount" | "updatedAt";

interface PodcastSortState {
  key: PodcastSortKey | null;
  order: "asc" | "desc" | null;
}

export function SubscribedPodcastTable({ podcasts }: SubscribedPodcastTableProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const { handlePlayPodcast, loadingPodcastId } = usePodcastPlay();
  const [sortState, setSortState] = useState<PodcastSortState>({ key: null, order: null });

  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const storePlaylistId = usePlayerStore((s) => s.playlistId);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const handleToggleSort = useCallback((key: PodcastSortKey) => {
    setSortState((current) => {
      if (current.key !== key) {
        const defaultOrder = key === "title" ? "asc" : "desc";
        return { key, order: defaultOrder };
      }
      const firstOrder = key === "title" ? "asc" : "desc";
      const secondOrder = key === "title" ? "desc" : "asc";

      if (current.order === firstOrder) {
        return { key, order: secondOrder };
      }
      return { key: null, order: null };
    });
  }, []);

  const handleResetSort = useCallback(() => {
    setSortState({ key: null, order: null });
  }, []);

  const sortedPodcasts = useMemo(() => {
    const { key, order } = sortState;
    if (!key || !order) return podcasts;

    return [...podcasts].sort((a, b) => {
      let comparison = 0;
      switch (key) {
        case "title":
          comparison = (a.name || "").localeCompare(b.name || "", undefined, {
            numeric: true,
            sensitivity: "base",
          });
          break;
        case "playCount":
          comparison = (a.playCount ?? 0) - (b.playCount ?? 0);
          break;
        case "voiceCount":
          comparison = (a.programCount ?? 0) - (b.programCount ?? 0);
          break;
        case "updatedAt": {
          const timeA = a.lastProgramCreateTime ?? a.createTime ?? 0;
          const timeB = b.lastProgramCreateTime ?? b.createTime ?? 0;
          comparison = timeA - timeB;
          break;
        }
      }
      return order === "asc" ? comparison : -comparison;
    });
  }, [podcasts, sortState]);

  return (
    <Table containerClassName="overflow-x-auto" className="w-full table-fixed text-content-muted">
      <TableHeader className="border-b border-content/5">
        <TableRow className="border-none hover:bg-transparent">
          <TableHead
            className="w-12 cursor-pointer text-center text-content-muted transition-colors hover:text-content"
            onClick={handleResetSort}
            title={sortState.key ? "点击恢复默认排序" : undefined}
          >
            #
          </TableHead>
          <TableHead
            className="cursor-pointer text-content-muted transition-colors select-none hover:text-content"
            onClick={() => handleToggleSort("title")}
          >
            <div className="flex items-center gap-1">
              {t("library.podcasts.column.title")}
              {sortState.key === "title" && sortState.order === "asc" && (
                <ChevronUp className="size-3.5" />
              )}
              {sortState.key === "title" && sortState.order === "desc" && (
                <ChevronDown className="size-3.5" />
              )}
            </div>
          </TableHead>
          <TableHead className="hidden w-56 text-content-muted select-none lg:table-cell">
            {t("library.podcasts.recentPlay")}
          </TableHead>
          <TableHead
            className="hidden w-28 cursor-pointer text-right text-content-muted transition-colors select-none hover:text-content sm:table-cell"
            onClick={() => handleToggleSort("playCount")}
          >
            <div className="flex items-center justify-end gap-1">
              {t("library.podcasts.column.playCount")}
              {sortState.key === "playCount" && sortState.order === "asc" && (
                <ChevronUp className="size-3.5" />
              )}
              {sortState.key === "playCount" && sortState.order === "desc" && (
                <ChevronDown className="size-3.5" />
              )}
            </div>
          </TableHead>
          <TableHead
            className="hidden w-24 cursor-pointer text-right text-content-muted transition-colors select-none hover:text-content sm:table-cell"
            onClick={() => handleToggleSort("voiceCount")}
          >
            <div className="flex items-center justify-end gap-1">
              {t("library.podcasts.column.voiceCount")}
              {sortState.key === "voiceCount" && sortState.order === "asc" && (
                <ChevronUp className="size-3.5" />
              )}
              {sortState.key === "voiceCount" && sortState.order === "desc" && (
                <ChevronDown className="size-3.5" />
              )}
            </div>
          </TableHead>
          <TableHead
            className="hidden w-28 cursor-pointer text-right text-content-muted transition-colors select-none hover:text-content lg:table-cell"
            onClick={() => handleToggleSort("updatedAt")}
          >
            <div className="flex items-center justify-end gap-1">
              {t("library.podcasts.column.updatedAt")}
              {sortState.key === "updatedAt" && sortState.order === "asc" && (
                <ChevronUp className="size-3.5" />
              )}
              {sortState.key === "updatedAt" && sortState.order === "desc" && (
                <ChevronDown className="size-3.5" />
              )}
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPodcasts.map((podcast, index) => {
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
              className="group cursor-pointer border-none transition-colors duration-150 select-none hover:bg-content/10"
            >
              <TableCell className="rounded-l-md py-1.5 text-center text-xs text-content-subtle tabular-nums">
                {isActive && isPlaying ? (
                  <div className="flex items-center justify-center group-hover:hidden">
                    <PlayingAnimation className="h-3.5" />
                  </div>
                ) : isActive && !isPlaying ? (
                  <Play className="mx-auto size-3.5 fill-current text-brand group-hover:hidden" />
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
                      className="inline-flex items-center justify-center text-brand transition-transform hover:scale-110"
                    >
                      <Pause className="size-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title={t("common.action.play")}
                      onClick={(e) => handlePlayPodcast(podcast.id, e)}
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
              </TableCell>
              <TableCell className="py-1.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface-elevated">
                    {podcast.picUrl ? (
                      <Image
                        width={80}
                        height={80}
                        src={podcast.picUrl}
                        alt={podcast.name || "podcast"}
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
                      {[podcast.dj?.nickname, categories].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden py-1.5 lg:table-cell">
                {podcast.latestEpisodeName ? (
                  <span className="flex min-w-0 items-center gap-1.5 text-sm text-content-muted">
                    <Headphones className="size-3.5 shrink-0 text-success" />
                    <span className="truncate" title={podcast.latestEpisodeName}>
                      {podcast.latestEpisodeName}
                    </span>
                  </span>
                ) : (
                  <span className="text-content-subtle">-</span>
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
