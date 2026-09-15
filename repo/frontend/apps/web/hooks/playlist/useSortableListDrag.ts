"use client";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
  Modifier,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { getEventCoordinates } from "@dnd-kit/utilities";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListInsertionTarget, SortableListProps } from "@/types/sortableList";

// The compact preview follows the pointer instead of the source row's left edge.
const followPointer: Modifier = ({ activatorEvent, activeNodeRect, transform }) => {
  const point = activatorEvent ? getEventCoordinates(activatorEvent) : null;
  return point && activeNodeRect
    ? {
        ...transform,
        x: transform.x + point.x - activeNodeRect.left + 12,
        y: transform.y + point.y - activeNodeRect.top + 12,
        scaleX: 1,
        scaleY: 1,
      }
    : { ...transform, scaleX: 1, scaleY: 1 };
};
export const thumbnailModifiers = [followPointer];

export function useSortableListDrag({ ids, disabled = false, canMove, onMove }: SortableListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [landingId, setLandingId] = useState<UniqueIdentifier | null>(null);
  const [landingVersion, setLandingVersion] = useState(0);
  const consumedLandingVersion = useRef(0);
  // Keep this outside virtual rows: scrolling can unmount and recreate them.
  const consumeLanding = useCallback((version: number) => {
    if (version <= consumedLandingVersion.current) return false;
    consumedLandingVersion.current = version;
    return true;
  }, []);
  const [keyboardDrag, setKeyboardDrag] = useState(false);
  const [insertion, setInsertion] = useState<ListInsertionTarget | null>(null);
  const targetRef = useRef<ListInsertionTarget | null>(null);
  const snapshot = useRef<UniqueIdentifier[]>([]);
  const suppressClick = useRef(false);
  const activeRef = useRef<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    // Moving while holding the mouse must not permanently cancel the pending drag.
    // Touch keeps a movement tolerance so swiping can still scroll the list.
    useSensor(MouseSensor, {
      activationConstraint: { delay: 180, tolerance: Number.POSITIVE_INFINITY },
    }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useEffect(() => {
    const stopClick = (event: MouseEvent) => {
      if (!suppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    };
    const reset = () => {
      if (activeRef.current === null) suppressClick.current = false;
    };
    document.addEventListener("click", stopClick, true);
    document.addEventListener("mousedown", reset, true);
    document.addEventListener("touchstart", reset, true);
    return () => {
      document.removeEventListener("click", stopClick, true);
      document.removeEventListener("mousedown", reset, true);
      document.removeEventListener("touchstart", reset, true);
    };
  }, []);
  const clear = () => {
    activeRef.current = null;
    targetRef.current = null;
    setActiveId(null);
    setInsertion(null);
  };
  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    if (disabled) return;
    snapshot.current = [...ids];
    suppressClick.current = true;
    activeRef.current = active.id;
    setKeyboardDrag(activatorEvent.type === "keydown");
    setLandingId(null);
    setActiveId(active.id);
  };
  const syncInsertion = () =>
    setInsertion((current) => {
      const next = targetRef.current;
      return current?.id === next?.id &&
        current?.placement === next?.placement &&
        current?.index === next?.index
        ? current
        : next;
    });
  const onDragEnd = ({ active }: DragEndEvent) => {
    const from = ids.indexOf(active.id);
    const to = targetRef.current?.index ?? from;
    const unchanged =
      snapshot.current.length === ids.length &&
      snapshot.current.every((id, index) => id === ids[index]);
    if (
      !disabled &&
      unchanged &&
      from >= 0 &&
      to >= 0 &&
      (from === to || !canMove || canMove(from, to))
    ) {
      if (from !== to) onMove(from, to);
      setLandingId(active.id);
      setLandingVersion((version) => version + 1);
    }
    clear();
  };
  const collisionDetection: CollisionDetection = (args) => {
    const point = args.pointerCoordinates;
    const collisions = closestCenter(
      point
        ? {
            ...args,
            collisionRect: {
              ...args.collisionRect,
              left: point.x,
              right: point.x,
              top: point.y,
              bottom: point.y,
              width: 0,
              height: 0,
            },
          }
        : args,
    );
    const over = collisions[0];
    const rect = over ? args.droppableRects.get(over.id) : undefined;
    const from = ids.indexOf(args.active.id);
    const overIndex = over ? ids.indexOf(over.id) : -1;
    targetRef.current = null;
    if (!over || !rect || from < 0 || overIndex < 0) return [];
    if (point && (point.x < rect.left || point.x > rect.right)) return [];
    const after = point ? point.y >= rect.top + rect.height / 2 : overIndex > from;
    const to = Math.max(
      0,
      Math.min(
        ids.length - 1,
        overIndex + Number(after) - Number(from < overIndex + Number(after)),
      ),
    );
    if (to !== from && canMove && !canMove(from, to)) return [];
    if (to !== from)
      targetRef.current = { id: over.id, placement: after ? "after" : "before", index: to };
    return collisions;
  };
  return {
    activeId,
    landingId,
    landingVersion,
    consumeLanding,
    insertion,
    keyboardDrag,
    sensors,
    onDragStart,
    onDragEnd,
    syncInsertion,
    clear,
    collisionDetection,
  };
}
