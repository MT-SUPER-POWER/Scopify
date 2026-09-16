"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ListMusic } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { toast } from "sonner";

import { SortableList } from "@/components/shared/SortableList";
import { DragThumbnail } from "@/components/shared/DragThumbnail";
import { SortablePlayerQueueItem } from "@/components/player/SortablePlayerQueueItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/store";
import { useAppDragStore } from "@/store/module/appDrag";
import { useI18n } from "@/store/module/i18n";
import type { PlayerQueueListHandle, PlayerQueueListProps } from "@/types/components/player";

export const PlayerQueueList = forwardRef<PlayerQueueListHandle, PlayerQueueListProps>(
  function PlayerQueueList({ isOpen }, ref) {
    const { t } = useI18n();
    const queue = usePlayerStore((state) => state.queue);
    const queueIndex = usePlayerStore((state) => state.queueIndex);
    const moveQueueItem = usePlayerStore((state) => state.moveQueueItem);
    const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const removeQueueItem = usePlayerStore((state) => state.removeQueueItem);
    const togglePlaying = usePlayerStore((state) => state.togglePlaying);
    const parentRef = useRef<HTMLDivElement>(null);
    const hasScrolledOnOpen = useRef(false);
    const ids = useMemo(() => {
      const occurrences = new Map<number, number>();
      return queue.map((song) => {
        const occurrence = occurrences.get(song.id) ?? 0;
        occurrences.set(song.id, occurrence + 1);
        return `queue-item-${song.id}-${occurrence}`;
      });
    }, [queue]);
    const virtualizer = useVirtualizer({
      count: queue.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 60,
      overscan: 5,
    });

    const scrollToCurrent = useCallback(() => {
      if (queueIndex < 0) return;
      virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "smooth" });
    }, [queueIndex, virtualizer]);
    useImperativeHandle(ref, () => ({ scrollToCurrent }), [scrollToCurrent]);

    useEffect(() => {
      if (isOpen && !hasScrolledOnOpen.current && queueIndex >= 0) {
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "auto" });
          hasScrolledOnOpen.current = true;
        });
      }
      if (!isOpen) hasScrolledOnOpen.current = false;
    }, [isOpen, queueIndex, virtualizer]);

    const handlePlay = (index: number) => {
      if (index === queueIndex) void togglePlaying();
      else void playQueueIndex(index);
    };
    const handleRemove = (index: number) => {
      removeQueueItem(index);
      toast.success(t("contextMenu.removeFromQueue"));
    };

    return (
      <SortableList
        ids={ids}
        onMove={moveQueueItem}
        onDragStart={(activeId) => {
          const song = queue[ids.indexOf(String(activeId))];
          if (song) {
            useAppDragStore.getState().startDrag([song]);
          }
        }}
        renderOverlay={(id) => {
          const song = queue[ids.indexOf(String(id))];
          return song ? (
            <DragThumbnail
              cover={song.al.picUrl}
              title={song.name}
              subtitle={song.ar.map((artist) => artist.name).join(" / ")}
            />
          ) : null;
        }}
      >
        <ScrollArea viewportRef={parentRef} className="h-125 w-full">
          <div className="p-2">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-content-muted">
                <ListMusic className="size-10 opacity-60" />
              </div>
            ) : (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const index = virtualRow.index;
                  const song = queue[index];
                  const isActive = index === queueIndex;
                  return (
                    <SortablePlayerQueueItem
                      key={ids[index]}
                      id={ids[index]}
                      song={song}
                      index={index}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      virtualStart={virtualRow.start}
                      virtualSize={virtualRow.size}
                      onPlay={handlePlay}
                      onRemove={handleRemove}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SortableList>
    );
  },
);
