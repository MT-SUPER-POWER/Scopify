"use client";

import { type DragEvent, useCallback, useState } from "react";

import type { PlayerQueueDropTarget } from "@/types/components/player";

export function usePlayerQueueDrag(
  queueLength: number,
  moveQueueItem: (fromIndex: number, toIndex: number) => void,
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<PlayerQueueDropTarget | null>(null);

  const clear = useCallback(() => {
    setDraggedIndex(null);
    setDropTarget(null);
  }, []);
  const onDragStart = useCallback((event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDraggedIndex(index);
  }, []);
  const onDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (draggedIndex === null) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const placement = event.clientY - rect.top > rect.height / 2 ? "after" : "before";
      if (dropTarget?.index !== index || dropTarget.placement !== placement) {
        setDropTarget({ index, placement });
      }
    },
    [draggedIndex, dropTarget],
  );
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      event.preventDefault();
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
          queueLength - 1,
        ),
      );
      if (draggedIndex !== targetIndex) moveQueueItem(draggedIndex, targetIndex);
      clear();
    },
    [clear, draggedIndex, moveQueueItem, queueLength],
  );

  return { clear, draggedIndex, dropTarget, onDragOver, onDragStart, onDrop };
}
