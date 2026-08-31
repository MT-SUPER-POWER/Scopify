"use client";

import { GripVertical, Music, Pause, Play } from "lucide-react";

import { CommandWorkspaceQueueItemMenu } from "@/components/commandWorkspace/CommandWorkspaceQueueItemMenu";
import { CommandWorkspaceQueueItemMetadata } from "@/components/commandWorkspace/CommandWorkspaceQueueItemMetadata";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { cn, formatDuration } from "@/lib/utils";
import type { CommandWorkspaceQueueItemProps } from "@/types/commandWorkspace";

export function CommandWorkspaceQueueItem({
  index,
  isCurrent,
  isCurrentPlaying,
  isDragging,
  isTargetAfter,
  isTargetBefore,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onNavigateAlbum,
  onNavigateArtist,
  onPlay,
  onRemove,
  track,
}: CommandWorkspaceQueueItemProps) {
  const coverUrl = track.al?.picUrl ? `${track.al.picUrl}?param=80y80` : null;

  return (
    <div
      draggable
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, index)}
      onDragStart={(event) => onDragStart(event, index)}
      onDrop={(event) => onDrop(event, index)}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all select-none",
        isCurrent ? "bg-white/10" : "hover:bg-white/6",
        isDragging && "scale-0.98 opacity-30",
        isTargetBefore &&
          "before:absolute before:inset-x-2 before:-top-0.5 before:z-10 before:h-0.5 before:rounded-full before:bg-brand",
        isTargetAfter &&
          "after:absolute after:inset-x-2 after:-bottom-0.5 after:z-10 after:h-0.5 after:rounded-full after:bg-brand",
      )}
    >
      <div className="flex w-5 shrink-0 items-center justify-center">
        <span className="cursor-grab text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-300 active:cursor-grabbing">
          <GripVertical className="size-3.5" />
        </span>
        {isCurrentPlaying ? (
          <PlayingAnimation size={14} className="group-hover:hidden" />
        ) : (
          <span
            className={cn(
              "text-xs tabular-nums transition-opacity group-hover:hidden",
              isCurrent ? "font-semibold text-brand" : "text-zinc-500",
            )}
          >
            {index + 1}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPlay(index)}
        className="relative size-10 shrink-0 overflow-hidden rounded-md bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        title={isCurrent ? (isCurrentPlaying ? "暂停" : "继续播放") : `播放 ${track.name}`}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={track.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-white/5 text-zinc-500">
            <Music className="size-4" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          {isCurrentPlaying ? (
            <Pause className="size-4 fill-white text-white" />
          ) : (
            <Play className="size-4 translate-x-0.5 fill-white text-white" />
          )}
        </div>
      </button>

      <CommandWorkspaceQueueItemMetadata
        index={index}
        isCurrent={isCurrent}
        onNavigateAlbum={onNavigateAlbum}
        onNavigateArtist={onNavigateArtist}
        onPlay={onPlay}
        track={track}
      />

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-xs text-zinc-500 tabular-nums">{formatDuration(track.dt)}</span>
        <CommandWorkspaceQueueItemMenu
          index={index}
          onNavigateAlbum={onNavigateAlbum}
          onNavigateArtist={onNavigateArtist}
          onRemove={onRemove}
          track={track}
        />
      </div>
    </div>
  );
}
