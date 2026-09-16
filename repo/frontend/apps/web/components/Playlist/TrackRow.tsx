"use client";

import { forwardRef, memo } from "react";
import { TableRow } from "@/components/ui/table";
import { TrackRowCells } from "@/components/Playlist/TrackRowCells";
import { cn } from "@/lib/utils";
import type { TrackRowProps } from "@/types/components/playlist";

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
      isSelected = false,
      onLikeToggle: _onLikeToggle,
      onRequestDelete: _onRequestDelete,
      playlistID: _playlistID,
      onPlay,
      onRowClick,
      setIsPlaying,
      track,
      ...props
    },
    ref,
  ) {
    return (
      <TableRow
        ref={ref}
        className={cn(
          "group cursor-default border-none hover:bg-content/10",
          isScrolling ? "**:transition-none" : "transition-colors",
          isActive && "text-brand",
          isSelected && "bg-content/10",
          className,
        )}
        onClick={onRowClick}
        onDoubleClick={() => onPlay(track)}
        {...props}
      >
        <TrackRowCells
          track={track}
          index={index}
          isActive={isActive}
          isLiked={isLiked}
          isPlaying={isPlaying}
          isScrolling={isScrolling}
          hideAlbumColumn={hideAlbumColumn}
          hideDateColumn={hideDateColumn}
          hideLikeColumn={hideLikeColumn}
          onPlay={onPlay}
          setIsPlaying={setIsPlaying}
        />
      </TableRow>
    );
  }),
);
