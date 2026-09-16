"use client";

import { LibraryItem } from "@/components/Siderbar/LibraryItem";
import { useSortableListItem } from "@/hooks/playlist/useSortableListItem";
import { useSidebarPlaylistDrop } from "@/hooks/playlist/useSidebarPlaylistDrop";
import type { SortableLibraryItemProps } from "@/types/components/sidebar";

export function SortableLibraryItem({ locked, playlist, ...props }: SortableLibraryItemProps) {
  const drop = useSidebarPlaylistDrop(playlist);
  const drag = useSortableListItem(props.id, locked || drop.dragging);
  return (
    <div
      {...drag.rowProps}
      {...drop.props}
      ref={drag.setNodeRef}
      style={drag.style}
      className="group relative rounded-md"
    >
      <LibraryItem {...props} />
    </div>
  );
}
