import type { TrackDragPoint, TrackDropTarget } from "@/types/trackDrag";

// Lists have independent DndContexts. Resolve sidebar targets against the actual
// hit-tested DOM, including clipping/overlays, rather than cross-context IDs.
export const trackDropTargets = new Map<string, TrackDropTarget>();

export function findTrackDropTarget(point: TrackDragPoint | null) {
  if (!point) return undefined;
  const element = document.elementFromPoint(point.x, point.y);
  const id = element?.closest<HTMLElement>("[data-track-drop-target]")?.dataset.trackDropTarget;
  const target = id ? trackDropTargets.get(id) : undefined;
  return target?.enabled ? target : undefined;
}
