"use client";

import { LibraryItem } from "@/components/Siderbar/LibraryItem";
import { useSortableListItem } from "@/hooks/playlist/useSortableListItem";
import type { SortableLibraryItemProps } from "@/types/components/sidebar";

export function SortableLibraryItem({ locked, ...props }: SortableLibraryItemProps) {
  const drag = useSortableListItem(props.id, locked);
  return (
    <div
      {...drag.rowProps}
      ref={drag.setNodeRef}
      style={drag.style}
      className="group relative rounded-md"
    >
      <LibraryItem {...props} />
    </div>
  );
}
