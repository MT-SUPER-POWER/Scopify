"use client";

import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { memo } from "react";

import { PlayerQueueItemCover } from "@/components/player/PlayerQueueItemCover";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { cn, formatDuration } from "@/lib/utils";
import type { QueueItemProps } from "@/types/components/player";

export const PlayerQueueItem = memo(
  function PlayerQueueItem({
    song,
    index,
    isActive,
    isPlaying,
    isDragging,
    isDropTargetAfter,
    isDropTargetBefore,
    virtualStart,
    virtualSize,
    onDragEnd,
    onDragOver,
    onDragStart,
    onDrop,
    onPlay,
    onRemove,
  }: QueueItemProps) {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${virtualSize}px`,
          transform: `translateY(${virtualStart}px)`,
        }}
        draggable={Boolean(onDragStart)}
        onDragEnd={onDragEnd}
        onDragOver={(event) => onDragOver?.(event, index)}
        onDragStart={(event) => onDragStart?.(event, index)}
        onDrop={(event) => onDrop?.(event, index)}
        className={cn(
          "relative px-2",
          isDragging && "opacity-35",
          isDropTargetBefore &&
            "before:absolute before:inset-x-3 before:top-0 before:z-20 before:h-0.5 before:rounded-full before:bg-brand",
          isDropTargetAfter &&
            "after:absolute after:inset-x-3 after:bottom-0 after:z-20 after:h-0.5 after:rounded-full after:bg-brand",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: (index % 10) * 0.05 }}
          className="size-full"
        >
          <SongContextMenu
            song={song}
            isActive={isActive}
            isPlaying={isPlaying}
            onPlay={() => onPlay(index)}
            onRemoveFromQueue={() => onRemove(index)}
          >
            <div
              onClick={() => onPlay(index)}
              className={cn(
                "group flex h-full cursor-pointer items-center gap-3 rounded-md p-4 transition-all",
                isActive ? "bg-content/10" : "hover:bg-content/10",
              )}
            >
              <GripVertical className="size-3.5 cursor-grab text-content-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />
              <PlayerQueueItemCover
                index={index}
                isActive={isActive}
                isPlaying={isPlaying}
                song={song}
              />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "truncate text-sm font-medium",
                      isActive ? "text-brand" : "text-content",
                    )}
                    title={song.name}
                  >
                    {song.name}
                  </span>
                  <SongVipBadge fee={song.fee} />
                </div>
                <div className="mt-0.5 truncate text-xs text-content-muted">
                  <ArtistInlineLinks artists={song.ar} />
                </div>
              </div>
              <div className="pr-1 text-xs text-content-muted tabular-nums">
                {formatDuration(song.dt)}
              </div>
            </div>
          </SongContextMenu>
        </motion.div>
      </div>
    );
  },
  (previous, next) =>
    previous.isActive === next.isActive &&
    previous.isPlaying === next.isPlaying &&
    previous.isDragging === next.isDragging &&
    previous.isDropTargetAfter === next.isDropTargetAfter &&
    previous.isDropTargetBefore === next.isDropTargetBefore &&
    previous.virtualStart === next.virtualStart &&
    previous.song.id === next.song.id,
);
