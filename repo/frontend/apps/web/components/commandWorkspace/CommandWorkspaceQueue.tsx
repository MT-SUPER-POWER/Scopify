"use client";

import { useRouter } from "next/navigation";
import { type DragEvent, useState } from "react";

import { CommandWorkspaceQueueItem } from "@/components/commandWorkspace/CommandWorkspaceQueueItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import type {
  CommandWorkspaceQueueDropTarget,
  CommandWorkspaceQueueProps,
} from "@/types/commandWorkspace";

export function CommandWorkspaceQueue({ onClose }: CommandWorkspaceQueueProps) {
  const router = useRouter();
  const playback = usePlaybackProjection();
  const playbackCommands = usePlaybackCommands();
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<CommandWorkspaceQueueDropTarget | null>(null);

  if (queue.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-zinc-500">播放队列为空。</p>;
  }

  const clearDragState = () => {
    setDraggedIndex(null);
    setDropTarget(null);
  };
  const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDraggedIndex(index);
  };
  const handleItemDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (draggedIndex === null) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY - rect.top > rect.height / 2 ? "after" : "before";
    if (dropTarget?.index !== index || dropTarget.placement !== placement) {
      setDropTarget({ index, placement });
    }
  };
  const handleItemDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggedIndex === null) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const isBottomHalf = event.clientY - rect.top > rect.height / 2;
    const targetIndex = Math.max(
      0,
      Math.min(
        isBottomHalf
          ? draggedIndex < index
            ? index
            : index + 1
          : draggedIndex < index
            ? index - 1
            : index,
        queue.length - 1,
      ),
    );
    if (draggedIndex !== targetIndex) {
      void playbackCommands.moveQueueItem(draggedIndex, targetIndex);
    }
    clearDragState();
  };
  const handleContainerDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (
      draggedIndex !== null &&
      (dropTarget?.index !== queue.length - 1 || dropTarget.placement !== "after")
    ) {
      setDropTarget({ index: queue.length - 1, placement: "after" });
    }
  };
  const handleContainerDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== queue.length - 1) {
      void playbackCommands.moveQueueItem(draggedIndex, queue.length - 1);
    }
    clearDragState();
  };
  const navigate = (path: string) => {
    router.push(path, { scroll: false });
    onClose?.();
  };

  return (
    <ScrollArea className="h-[min(58vh,36rem)]">
      <div
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        className="min-h-[min(58vh,36rem)] space-y-0.5 px-2.5 py-2"
      >
        {queue.map((track, index) => {
          const isCurrent = index === queueIndex || String(playback.track?.id) === String(track.id);
          return (
            <CommandWorkspaceQueueItem
              key={`${track.voiceId ?? "song"}-${track.id}-${index}`}
              index={index}
              isCurrent={isCurrent}
              isCurrentPlaying={isCurrent && playback.isPlaying}
              isDragging={draggedIndex === index}
              isTargetAfter={
                dropTarget?.index === index &&
                dropTarget.placement === "after" &&
                draggedIndex !== index
              }
              isTargetBefore={
                dropTarget?.index === index &&
                dropTarget.placement === "before" &&
                draggedIndex !== index
              }
              onDragEnd={clearDragState}
              onDragOver={handleItemDragOver}
              onDragStart={handleDragStart}
              onDrop={handleItemDrop}
              onNavigateAlbum={(albumId) => navigate(`/album?id=${albumId}`)}
              onNavigateArtist={(artistId) => navigate(`/artist?id=${artistId}`)}
              onPlay={(targetIndex) => {
                if (targetIndex === queueIndex || isCurrent) void playbackCommands.toggle();
                else void playbackCommands.playQueueIndex(targetIndex);
              }}
              onRemove={(targetIndex) => void playbackCommands.removeQueueItem(targetIndex)}
              track={track}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
