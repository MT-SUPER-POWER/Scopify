"use client";

import { GripVertical, ListPlus, Music, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type DragEvent, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type { CommandWorkspaceQueueProps } from "@/types/commandWorkspace";

interface DropTarget {
  index: number;
  placement: "before" | "after";
}

export function CommandWorkspaceQueue({ onClose }: CommandWorkspaceQueueProps) {
  const router = useRouter();
  const moveQueueItem = usePlayerStore((state) => state.moveQueueItem);
  const moveQueueItemToNext = usePlayerStore((state) => state.moveQueueItemToNext);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const removeQueueItem = usePlayerStore((state) => state.removeQueueItem);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  if (queue.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-zinc-500">播放队列为空。</p>;
  }

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
    const isBottomHalf = event.clientY - rect.top > rect.height / 2;
    const placement = isBottomHalf ? "after" : "before";

    if (dropTarget?.index !== index || dropTarget?.placement !== placement) {
      setDropTarget({ index, placement });
    }
  };

  const handleItemDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();

    if (draggedIndex === null) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const isBottomHalf = event.clientY - rect.top > rect.height / 2;

    let targetIndex = index;
    if (isBottomHalf) {
      targetIndex = draggedIndex < index ? index : index + 1;
    } else {
      targetIndex = draggedIndex < index ? index - 1 : index;
    }

    targetIndex = Math.max(0, Math.min(targetIndex, queue.length - 1));

    if (draggedIndex !== targetIndex) {
      moveQueueItem(draggedIndex, targetIndex);
    }

    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleContainerDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (
      draggedIndex !== null &&
      (dropTarget?.index !== queue.length - 1 || dropTarget?.placement !== "after")
    ) {
      setDropTarget({ index: queue.length - 1, placement: "after" });
    }
  };

  const handleContainerDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== queue.length - 1) {
      moveQueueItem(draggedIndex, queue.length - 1);
    }
    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTarget(null);
  };

  const navigateToArtist = (artistId: number) => {
    router.push(`/artist?id=${artistId}`, { scroll: false });
    onClose?.();
  };

  const navigateToAlbum = (albumId: number) => {
    router.push(`/album?id=${albumId}`, { scroll: false });
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
          const isCurrent = index === queueIndex;
          const isDragging = draggedIndex === index;
          const isTargetBefore =
            dropTarget?.index === index &&
            dropTarget?.placement === "before" &&
            draggedIndex !== index;
          const isTargetAfter =
            dropTarget?.index === index &&
            dropTarget?.placement === "after" &&
            draggedIndex !== index;
          const coverUrl = track.al?.picUrl ? `${track.al.picUrl}?param=80y80` : null;

          return (
            <div
              key={`${track.voiceId ?? "song"}-${track.id}-${index}`}
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => handleItemDragOver(event, index)}
              onDrop={(event) => handleItemDrop(event, index)}
              onDragEnd={handleDragEnd}
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
              {/* 拖拽手柄与序号 */}
              <div className="flex w-5 shrink-0 items-center justify-center">
                <span className="cursor-grab text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-300 active:cursor-grabbing">
                  <GripVertical className="size-3.5" />
                </span>
                <span
                  className={cn(
                    "text-xs text-zinc-500 tabular-nums transition-opacity group-hover:hidden",
                    isCurrent && "font-semibold text-brand",
                  )}
                >
                  {index + 1}
                </span>
              </div>

              {/* 封面图片 */}
              <button
                type="button"
                onClick={() => void playQueueIndex(index)}
                className="relative size-10 shrink-0 overflow-hidden rounded-md bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
                title={isCurrent ? "当前正在播放" : `播放 ${track.name}`}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={track.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-white/5 text-zinc-500">
                    <Music className="size-4" />
                  </div>
                )}
                {isCurrent ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="size-3.5 fill-white text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="size-3.5 fill-white text-white" />
                  </div>
                )}
              </button>

              {/* 歌曲信息、歌手与专辑跳转 */}
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => void playQueueIndex(index)}
                  className="block w-full truncate text-left text-sm font-medium text-white hover:text-brand hover:underline"
                >
                  {track.name}
                </button>
                <div className="flex items-center truncate text-xs text-zinc-400">
                  {/* 歌手列表 */}
                  <span className="truncate">
                    {track.ar?.map((artist, aIndex) => (
                      <span key={`${artist.id || artist.name}-${aIndex}`}>
                        {artist.id ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigateToArtist(artist.id);
                            }}
                            className="hover:text-white hover:underline focus-visible:text-white"
                          >
                            {artist.name}
                          </button>
                        ) : (
                          <span>{artist.name}</span>
                        )}
                        {aIndex < (track.ar?.length ?? 0) - 1 ? " / " : ""}
                      </span>
                    ))}
                  </span>

                  {/* 专辑名称 */}
                  {track.al?.name ? (
                    <>
                      <span className="mx-1 text-zinc-600">·</span>
                      {track.al.id ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigateToAlbum(track.al.id);
                          }}
                          title={track.al.name}
                          className="max-w-35 truncate text-zinc-400 hover:text-white hover:underline focus-visible:text-white"
                        >
                          {track.al.name}
                        </button>
                      ) : (
                        <span className="max-w-35 truncate text-zinc-400">
                          {track.al.name}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* 时长与悬浮操作 */}
              <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                {formatDuration(track.dt)}
              </span>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveQueueItemToNext(index)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  title="下一首播放"
                  aria-label="下一首播放"
                >
                  <ListPlus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeQueueItem(index)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-red-300"
                  title="从队列移除"
                  aria-label="从队列移除"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
