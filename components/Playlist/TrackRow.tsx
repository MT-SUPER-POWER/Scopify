"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Disc3, Pause, Play } from "lucide-react";
import { forwardRef, memo, useCallback } from "react";
import { toast } from "sonner";

import type { TrackRowProps } from "@/types/components/playlist";

import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { SongTitleWithAlia } from "@/components/shared/SongTitleWithAlia";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { TableCell, TableRow } from "@/components/ui/table";
import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

import { LikeButton } from "../ui/LikeButton";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 子组件: 序号与播放状态 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackIndexCell({
  index,
  isActive,
  isPlaying,
  onPlay,
  setIsPlaying,
}: {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  setIsPlaying: (v: boolean) => void;
}) {
  return (
    <div className="group/cell relative flex size-4 items-center justify-center">
      <span className={cn("font-normal text-zinc-400 group-hover:hidden", isActive && "hidden")}>
        {index + 1}
      </span>

      {isActive && isPlaying && <PlayingAnimation className="h-3 group-hover:hidden" />}

      {isActive && !isPlaying && (
        <Play className="size-4 fill-current text-[#1ed760] group-hover:hidden" />
      )}

      <div className="hidden items-center justify-center group-hover:flex">
        {isActive && isPlaying ? (
          <Pause
            className="size-4 cursor-pointer fill-current text-[#1ed760]"
            onClick={() => setIsPlaying(false)}
          />
        ) : (
          <Play
            className="size-4 cursor-pointer fill-current text-white"
            onClick={() => onPlay()}
          />
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 主组件: 单行数据 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TrackRow = memo(
  forwardRef<HTMLTableRowElement, TrackRowProps>(function TrackRow(
    {
      className,
      durationColumnWidth,
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

          // 2. 触发全局 Sidebar 更新（解决封面等不同步的问题）
          if (store.triggerLibraryUpdate) {
            store.triggerLibraryUpdate();
          }
        } catch (error) {
          console.error("Failed to toggle like:", error);
        }
      },
      [track, t],
    );
    const smartRouter = useSmartRouter();
    return (
      <TableRow
        ref={ref}
        className={cn(
          "group cursor-default border-none hover:bg-white/10",
          isScrolling ? "**:transition-none" : "transition-colors",
          isActive && "text-[#1ed760]",
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
            <div className="size-10 shrink-0 rounded bg-zinc-800">
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
              <SongTitleWithAlia
                name={track.name}
                alia={track.alia}
                className={cn(
                  "w-full cursor-pointer text-base font-normal group-hover:underline",
                  isActive ? "text-[#1ed760]" : "text-white",
                )}
              />
              <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
                <SongQualityBadge qualityLevel={track.privilege?.maxBrLevel} />
                <SongVipBadge fee={track.fee} />
                <span className="min-w-0 cursor-pointer truncate text-sm font-normal text-zinc-400">
                  {track.ar.slice(0, 2).map((a, idx, arr) => (
                    <span
                      key={`${a.id}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        smartRouter.push(`/artist?id=${a.id}`);
                      }}
                      title={`/artist?id=${a.id}`}
                      className="hover:text-white hover:underline"
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
              className="group/album flex max-w-full min-w-0 items-center gap-1.5 text-left text-zinc-400 transition-colors hover:text-white hover:underline"
            >
              <Disc3
                className="size-3.5 shrink-0 text-zinc-600 transition-colors group-hover/album:text-white"
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
          <TableCell className="w-20 truncate">
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

        <TableCell
          className="w-20 rounded-r-md pr-4 text-right align-middle lg:w-36"
          style={durationColumnWidth === undefined ? undefined : { width: durationColumnWidth }}
        >
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
