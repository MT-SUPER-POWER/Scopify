"use client";
import { memo, useCallback } from "react";
import { Disc3 } from "lucide-react";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { TrackTitleCell } from "@/components/Playlist/TrackTitleCell";
import { TrackIndexCell } from "@/components/shared/TrackIndexCell";
import { TableCell } from "@/components/ui/table";
import { LikeButton } from "@/components/ui/LikeButton";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { formatDate, formatDuration } from "@/lib/utils";
import type { TrackRowCellsProps } from "@/types/components/playlist";

/** Keep the expensive cells independent of drag/context-menu DOM event props. */
export const TrackRowCells = memo(function TrackRowCells({
  track,
  index,
  isActive,
  isPlaying,
  isLiked,
  isScrolling,
  hideAlbumColumn,
  hideDateColumn,
  hideLikeColumn,
  onPlay,
  setIsPlaying,
}: TrackRowCellsProps) {
  const songLikeMutation = useSongLikeMutation();
  const smartRouter = useSmartRouter();
  const handleLike = useCallback(
    (nextLiked: boolean) => {
      songLikeMutation.mutate({ like: nextLiked, songId: track.id });
    },
    [songLikeMutation, track.id],
  );
  return (
    <>
      <TableCell className="rounded-l-md pl-4 text-left font-medium">
        <TrackIndexCell
          index={index}
          isActive={isActive}
          isPlaying={isPlaying}
          onPlay={() => onPlay(track)}
          setIsPlaying={setIsPlaying}
        />
      </TableCell>

      <TrackTitleCell track={track} isActive={isActive} />

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
    </>
  );
});
