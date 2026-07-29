"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";

import type { CarouselSwipeOptions } from "@/types/home";

const DEFAULT_THRESHOLD = 48;
const DRAG_START_THRESHOLD = 6;
const MAX_DRAG_OFFSET = 160;

export function useCarouselSwipe({
  onNext,
  onPrevious,
  threshold = DEFAULT_THRESHOLD,
}: CarouselSwipeOptions) {
  const dragStart = useRef<null | { pointerId: number; x: number }>(null);
  const isPointerCaptured = useRef(false);
  const shouldSuppressClick = useRef(false);
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
    isPointerCaptured.current = false;
    shouldSuppressClick.current = false;
    setDragOffset(0);
    setIsDragging(false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const offset = event.clientX - start.x;
    if (!isPointerCaptured.current) {
      if (Math.abs(offset) < DRAG_START_THRESHOLD) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      isPointerCaptured.current = true;
      setIsDragging(true);
    }

    setDragOffset(Math.max(-MAX_DRAG_OFFSET, Math.min(MAX_DRAG_OFFSET, offset)));
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const offset = event.clientX - start.x;
    const wasPointerCaptured = isPointerCaptured.current;
    if (wasPointerCaptured && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resetDrag();
    isPointerCaptured.current = false;

    const didSwipe = wasPointerCaptured && !cancelled && Math.abs(offset) >= threshold;
    shouldSuppressClick.current = didSwipe;
    if (!didSwipe) return;
    if (offset < 0) onNext();
    else onPrevious();
  };

  const suppressClickAfterSwipe = (event: MouseEvent<HTMLDivElement>) => {
    if (!shouldSuppressClick.current) return;

    shouldSuppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    dragOffset,
    isDragging,
    suppressClickAfterSwipe,
    swipeHandlers: {
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => onPointerEnd(event, true),
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => onPointerEnd(event),
    },
  };
}
