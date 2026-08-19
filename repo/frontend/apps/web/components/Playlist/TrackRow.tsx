"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Disc3 } from "lucide-react";
import { forwardRef, memo, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import type { TrackRowProps } from "@/types/components/playlist";

import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { MediaTitle } from "@scopify/ui/scopify/components/media-title";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { TrackIndexCell } from "@/components/shared/TrackIndexCell";
import { TableCell, TableRow } from "@/components/ui/table";
import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

import { LikeButton } from "@scopify/ui/scopify/components/like-button";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 主组件: 单行数据 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TrackRow = memo(
  forwardRef<HTMLTableRowElement, TrackRowProps>(function TrackRow(
    {
      className,
      hideAlbumColumn,
      hideDateColumn,
      hideLikeColumn,
      index,
      isActive,
      isLiked,
      isPlaying,
      isScrolling = false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onLikeToggle,
      onPlay,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onRequestDelete,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      playlistID,
      setIsPlaying,
      track,
      ...props
    },
    ref,
  ) {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const handleLike = useCallback(
      async (nextLiked: boolean) => {
        try {
          await likeSong(track.id, nextLiked);
          const store = useUserStore.getState();
          const current = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];

          // 1. 本地乐观更新
          store.setLikeListIDs(
            nextLiked ? [...current, track.id] : current.filter((id: number) => id !== track.id),
          );
          void clearPageCache();
          toast.success(
            nextLiked ? t("playlist.track.likedAdded") : t("playlist.track.likedRemoved"),
          );

          // 2. 触发全局 TanStack Query 缓存失效
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["library", "liked-playlist"] }),
            queryClient.invalidateQueries({ queryKey: ["library", "playlists"] }),
          ]);
        } catch (error) {
          console.error("Failed to toggle like:", error);
        }
      },
      [queryClient, track, t],
    );
    const smartRouter = useSmartRouter();
    return (
      <TableRow
        ref={ref}
        className={cn(
          "group cursor-default border-none hover:bg-content/10",
          isScrolling ? "**:transition-none" : "transition-colors",
          isActive && "text-brand",
          className,
        )}
        onDoubleClick={() => onPlay(track)}
        {...props}
      >
        <TableCell className="rounded-l-md pl-4 text-left font-medium">
          <TrackIndexCell
            index={index}
            isActive={isActive}
            isPlaying={isPlaying}
            onPlay={() => onPlay(track)}
            setIsPlaying={setIsPlaying}
          />
        </TableCell>

        <TableCell className="max-w-0 min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-10 shrink-0 rounded bg-surface-elevated">
              <img
                width={40}
                height={40}
                src={track.al.picUrl}
                alt={track.al.name}
                decoding="async"
                loading="lazy"
                className="size-full rounded object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col truncate">
              <MediaTitle
                name={track.name}
                aliases={track.alia}
                className={cn(
                  "w-full cursor-pointer text-base font-normal group-hover:underline",
                  isActive ? "text-brand" : "text-content",
                )}
              />
              <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
                <SongQualityBadge qualityLevel={track.privilege?.maxBrLevel} />
                <SongVipBadge fee={track.fee} />
                <span className="min-w-0 cursor-pointer truncate text-sm font-normal text-content-muted">
                  {track.ar.slice(0, 2).map((a, idx, arr) => (
                    <span
                      key={`${a.id}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        smartRouter.push(`/artist?id=${a.id}`);
                      }}
                      title={`/artist?id=${a.id}`}
                      className="hover:text-content hover:underline"
                      style={{ display: "inline" }}
                    >
                      {a.name}
                      {idx < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </TableCell>

        {!hideAlbumColumn && (
          <TableCell className="max-w-0">
            <button
              type="button"
              title={track.al.name}
              onClick={(e) => {
                e.stopPropagation();
                smartRouter.push(`/album?id=${track.al.id}`);
              }}
              className="group/album flex max-w-full min-w-0 items-center gap-1.5 text-left text-content-muted transition-colors hover:text-content hover:underline"
            >
              <Disc3
                className="size-3.5 shrink-0 text-content-subtle transition-colors group-hover/album:text-content"
                aria-hidden="true"
              />
              <span className="truncate">{track.al.name}</span>
            </button>
          </TableCell>
        )}

        {!hideDateColumn && (
          <TableCell className="truncate">
            <span title={formatDate(track.publishTime)}>{formatDate(track.publishTime)}</span>
          </TableCell>
        )}

        {!hideLikeColumn && (
          <TableCell className="truncate">
            <div className="flex size-full justify-center">
              <LikeButton
                liked={isLiked}
                disabled={isScrolling}
                onLike={() => {
                  void handleLike(!isLiked);
                }}
                iconClassName="w-4.5 h-4.5"
              />
            </div>
          </TableCell>
        )}

        <TableCell className="rounded-r-md pr-4 text-right align-middle">
          <div className="flex items-center justify-end">
            <span title={formatDuration(track.dt)}>{formatDuration(track.dt)}</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }),
  (prev: TrackRowProps, next: TrackRowProps) =>
    prev.track.id === next.track.id &&
    prev.isActive === next.isActive &&
    prev.isPlaying === next.isPlaying &&
    prev.isLiked === next.isLiked &&
    prev.index === next.index &&
    prev.hideAlbumColumn === next.hideAlbumColumn &&
    prev.hideDateColumn === next.hideDateColumn &&
    prev.hideLikeColumn === next.hideLikeColumn &&
    prev.isScrolling === next.isScrolling &&
    prev.track.fee === next.track.fee &&
    prev.track.privilege?.maxBrLevel === next.track.privilege?.maxBrLevel &&
    prev.track.alia?.join() === next.track.alia?.join(),
);
