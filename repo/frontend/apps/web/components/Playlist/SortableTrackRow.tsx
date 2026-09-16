"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { TrackRow } from "@/components/Playlist/TrackRow";
import { useSortableListItem } from "@/hooks/playlist/useSortableListItem";
import type { SortableTrackRowProps } from "@/types/components/playlist";

export const SortableTrackRow = forwardRef<HTMLTableRowElement, SortableTrackRowProps>(
  function SortableTrackRow({ allowReorder, onRowElementChange, ...props }, ref) {
    const drag = useSortableListItem(props.track.id, false, allowReorder);
    const setDragNodeRef = drag.setNodeRef;
    const index = props.index;
    const setRowRef = useCallback(
      (node: HTMLTableRowElement | null) => {
        setDragNodeRef(node);
        onRowElementChange?.(index, node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [setDragNodeRef, onRowElementChange, index, ref],
    );
    const style = useMemo(() => ({ ...props.style, ...drag.style }), [props.style, drag.style]);
    return <TrackRow {...props} {...drag.rowProps} ref={setRowRef} style={style} />;
  },
);
