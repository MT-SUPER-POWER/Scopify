"use client";

import { PlayerQueueItem } from "@/components/player/PlayerQueueItem";
import { useSortableListItem } from "@/hooks/playlist/useSortableListItem";
import type { SortablePlayerQueueItemProps } from "@/types/components/player";

export function SortablePlayerQueueItem({
  id,
  virtualStart,
  virtualSize,
  ...props
}: SortablePlayerQueueItemProps) {
  const drag = useSortableListItem(id);
  return (
    <div
      ref={drag.setNodeRef}
      {...drag.rowProps}
      className="px-2"
      style={{
        position: "absolute",
        top: virtualStart,
        left: 0,
        width: "100%",
        height: virtualSize,
        ...drag.style,
      }}
    >
      <PlayerQueueItem {...props} />
    </div>
  );
}
