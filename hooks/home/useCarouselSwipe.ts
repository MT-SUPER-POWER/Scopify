"use client";

import { useRef, useState, type PointerEvent } from "react";

import type { CarouselSwipeOptions } from "@/types/home";

const DEFAULT_THRESHOLD = 48;
const MAX_DRAG_OFFSET = 160;

export function useCarouselSwipe({
  onNext,
  onPrevious,
  threshold = DEFAULT_THRESHOLD,
}: CarouselSwipeOptions) {
  const dragStart = useRef<null | { pointerId: number; x: number }>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetDrag = () => {
    dragStart.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragStart.current = { pointerId: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const offset = event.clientX - start.x;
    setDragOffset(Math.max(-MAX_DRAG_OFFSET, Math.min(MAX_DRAG_OFFSET, offset)));
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const offset = event.clientX - start.x;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resetDrag();

    if (cancelled || Math.abs(offset) < threshold) return;
    if (offset < 0) onNext();
    else onPrevious();
  };

  return {
    dragOffset,
    isDragging,
    swipeHandlers: {
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => onPointerEnd(event, true),
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => onPointerEnd(event),
    },
  };
}
