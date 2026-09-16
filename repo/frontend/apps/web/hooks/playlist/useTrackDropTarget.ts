"use client";

import { useEffect } from "react";
import { trackDropTargets } from "@/lib/playlist/trackDropTargets";
import { useAppDragStore } from "@/store/module/appDrag";
import type { TrackDropTarget } from "@/types/trackDrag";

export function useTrackDropTarget(target: TrackDropTarget) {
  const { id, onDrop } = target;
  const dragging = useAppDragStore((state) => state.isDragging);
  const hovered = useAppDragStore((state) => state.overTargetId === id);
  const pending = useAppDragStore((state) => state.pendingTargetIds.includes(id));
  const enabled = target.enabled && !pending;
  useEffect(() => {
    const entry = { id, onDrop, enabled };
    trackDropTargets.set(id, entry);
    return () => {
      if (trackDropTargets.get(id) === entry) trackDropTargets.delete(id);
    };
  }, [id, onDrop, enabled]);
  return {
    dragging,
    pending,
    targeted: dragging && enabled && hovered,
    props: {
      "data-track-drop-target": id,
      "data-track-drop-enabled": enabled,
      "data-track-drop-hovered": dragging && enabled && hovered,
      "aria-busy": pending || undefined,
    },
  };
}
