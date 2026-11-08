"use client";
import { memo, useCallback } from "react";
import { Disc3 } from "lucide-react";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { TrackTitleCell } from "@/components/Playlist/TrackTitleCell";
import { TrackIndexCell } from "@/components/shared/TrackIndexCell";
import { TableCell } from "@/components/ui/table";
import { LikeButton } from "@/components/ui/LikeButton";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";
import { formatDate, formatDuration } from "@/lib/utils";
import type { TrackRowCellsProps } from "@/types/playlist/components";

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
  const canOpenAlbum = useProviderCapability("album.read");
  // Liking goes through NetEase's like list; other platforms' rows have no like button yet.
  const neteaseId = getNeteaseTrackId(track);
  const album = track.album;
  const albumTitle = album?.title ?? "";
  const publishTime = track.netease?.publishTime ?? 0;
  const handleLike = useCallback(
    (nextLiked: boolean) => {
      if (neteaseId !== null) songLikeMutation.mutate({ like: nextLiked, songId: neteaseId });
    },
    [neteaseId, songLikeMutation],
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
          {/* 云盘未匹配文件等没有专辑实体（id 为 0），只展示名称。 */}
          {!album || album.ref.id === "0" || !canOpenAlbum ? (
            <span title={albumTitle} className="block truncate text-content-muted">
              {albumTitle || "-"}
            </span>
          ) : (
            <button
              type="button"
              title={albumTitle}
              onClick={(e) => {
                e.stopPropagation();
                smartRouter.push(`/album?id=${album.ref.id}`);
              }}
              className="group/album flex max-w-full min-w-0 items-center gap-1.5 text-left text-content-muted transition-colors hover:text-content hover:underline"
            >
              <Disc3
                className="size-3.5 shrink-0 text-content-subtle transition-colors group-hover/album:text-content"
                aria-hidden="true"
              />
              <span className="truncate">{albumTitle}</span>
            </button>
          )}
        </TableCell>
      )}

      {!hideDateColumn && (
        <TableCell className="truncate">
          <span title={formatDate(publishTime)}>{formatDate(publishTime)}</span>
        </TableCell>
      )}

      {!hideLikeColumn && (
        <TableCell className="truncate">
          {neteaseId !== null && (
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
          )}
        </TableCell>
      )}

      <TableCell className="rounded-r-md pr-4 text-right align-middle">
        <div className="flex items-center justify-end">
          <span title={formatDuration(track.durationMs)}>{formatDuration(track.durationMs)}</span>
        </div>
      </TableCell>
    </>
  );
});
