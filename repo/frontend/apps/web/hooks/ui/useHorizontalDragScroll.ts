"use client";

import { useRef, useState, type MouseEvent, type PointerEvent, type WheelEvent } from "react";

const DRAG_START_THRESHOLD = 4;

export function useHorizontalDragScroll() {
  const dragState = useRef<null | {
    pointerId: number;
    scrollLeft: number;
    x: number;
  }>(null);
  const didDrag = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragState.current = {
      pointerId: event.pointerId,
      scrollLeft: event.currentTarget.scrollLeft,
      x: event.clientX,
    };
    didDrag.current = false;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragState.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const offset = event.clientX - start.x;
    if (!didDrag.current && Math.abs(offset) < DRAG_START_THRESHOLD) return;
    if (!didDrag.current) {
      event.currentTarget.setPointerCapture(event.pointerId);
      didDrag.current = true;
      setIsDragging(true);
    }
    event.currentTarget.scrollLeft = start.scrollLeft - offset;
  };

  const endPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragState.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setIsDragging(false);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const row = event.currentTarget;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const maxScrollLeft = row.scrollWidth - row.clientWidth;
    const canScroll = delta > 0 ? row.scrollLeft < maxScrollLeft : row.scrollLeft > 0;
    if (!canScroll) return;
    event.preventDefault();
    row.scrollLeft += delta;
  };

  const suppressClickAfterDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!didDrag.current) return;
    didDrag.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    isDragging,
    scrollHandlers: {
      onClickCapture: suppressClickAfterDrag,
      onPointerCancel: endPointerDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointerDrag,
      onWheel,
    },
  };
}
