"use client";

import { useSortable } from "@dnd-kit/sortable";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { useReducedMotion } from "framer-motion";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { MouseEvent, TouchEvent, KeyboardEvent, DragEvent } from "react";
import { SortableListContext } from "@/lib/playlist/sortableListContext";
import { useAppDragStore } from "@/store/module/appDrag";

const isControl = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest("button,input,textarea,select,[contenteditable=true],[role=slider]"));

export function useSortableListItem(id: UniqueIdentifier, disabled = false, allowReorder = true) {
  const scope = useContext(SortableListContext);
  const multipleTracks = useAppDragStore((state) => state.draggedTracks.length > 1);
  const reducedMotion = useReducedMotion();
  const nodeRef = useRef<HTMLElement | null>(null);
  const enabled = Boolean(scope?.available && !disabled);
  const landingVersion = scope?.landingId === id ? scope.landingVersion : 0;
  const consumeLanding = scope?.consumeLanding;
  const sortable = useSortable({
    id,
    data: { allowReorder },
    disabled: {
      draggable: disabled || !scope || scope.disabled,
      droppable: disabled || !scope || scope.disabled || !allowReorder,
    },
    animateLayoutChanges: () => false,
    transition: null,
  });
  const listenersRef = useRef(sortable.listeners);
  listenersRef.current = sortable.listeners;
  const { setNodeRef: setSortableNodeRef, setActivatorNodeRef } = sortable;
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node;
      setSortableNodeRef(node);
      setActivatorNodeRef(node);
    },
    [setSortableNodeRef, setActivatorNodeRef],
  );
  useEffect(() => {
    if (!landingVersion || !consumeLanding?.(landingVersion)) return;
    if (scope?.keyboardDrag) nodeRef.current?.focus({ preventScroll: true });
    if (reducedMotion) return;
    const animation = nodeRef.current?.animate([{ opacity: 0.55 }, { opacity: 1 }], {
      duration: 160,
    });
    return () => animation?.cancel();
  }, [landingVersion, consumeLanding, reducedMotion, scope?.keyboardDrag]);
  const target = scope?.insertion?.id === id ? scope.insertion : null;
  const style = useMemo(
    () => ({
      opacity: sortable.isDragging ? 0.6 : undefined,
      boxShadow: target
        ? `inset 0 ${target.placement === "before" ? "2px" : "-2px"} 0 var(--color-brand)`
        : undefined,
      userSelect: enabled ? ("none" as const) : undefined,
    }),
    [sortable.isDragging, target, enabled],
  );
  const rowProps = useMemo(
    () =>
      enabled
        ? {
            ...sortable.attributes,
            "data-track-reorder":
              allowReorder && !scope?.reorderDisabled && !multipleTracks && scope?.activeId != null,
            role: undefined,
            onMouseDown: (event: MouseEvent<HTMLElement>) => {
              if (!isControl(event.target)) listenersRef.current?.onMouseDown?.(event);
            },
            onTouchStart: (event: TouchEvent<HTMLElement>) => {
              if (!isControl(event.target)) listenersRef.current?.onTouchStart?.(event);
            },
            onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
              if (event.target === event.currentTarget) listenersRef.current?.onKeyDown?.(event);
            },
            onDragStartCapture: (event: DragEvent<HTMLElement>) => event.preventDefault(),
            onContextMenuCapture: (event: MouseEvent<HTMLElement>) => {
              if (scope?.activeId !== null && scope?.activeId !== undefined) {
                event.preventDefault();
                event.stopPropagation();
              }
            },
          }
        : {},
    [
      enabled,
      sortable.attributes,
      allowReorder,
      scope?.reorderDisabled,
      multipleTracks,
      scope?.activeId,
    ],
  );
  return { enabled, setNodeRef, style, rowProps };
}
