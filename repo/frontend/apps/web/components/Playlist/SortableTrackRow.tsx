"use client";

import { forwardRef } from "react";
import { TrackRow } from "@/components/Playlist/TrackRow";
import { useSortableListItem } from "@/hooks/playlist/useSortableListItem";
import type { SortableTrackRowProps } from "@/types/components/playlist";

export const SortableTrackRow = forwardRef<HTMLTableRowElement, SortableTrackRowProps>(
  function SortableTrackRow({ allowReorder, ...props }, ref) {
    const drag = useSortableListItem(props.track.id, false, allowReorder);
    return (
      <TrackRow
        {...props}
        {...drag.rowProps}
        ref={(node) => {
          drag.setNodeRef(node);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        style={{ ...props.style, ...drag.style }}
      />
    );
  },
);
