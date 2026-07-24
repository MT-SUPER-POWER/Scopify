"use client";

import { useEffect } from "react";

const LINE_DELTA = 40;
const MAX_WHEEL_STEP = 180;
const SCROLL_EASING = 0.24;
const STOP_THRESHOLD = 0.5;

function getWheelDeltaY(event: WheelEvent, element: HTMLDivElement) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * LINE_DELTA;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * element.clientHeight;
  }

  return event.deltaY;
}

function clampScrollTop(value: number, element: HTMLDivElement) {
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  return Math.min(Math.max(value, 0), maxScrollTop);
}

export function useSmoothPlaylistScroll(scrollContainer: HTMLDivElement | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !scrollContainer) return;

    let animationFrame = 0;
    let currentScrollTop = scrollContainer.scrollTop;
    let targetScrollTop = scrollContainer.scrollTop;

    const stopAnimation = () => {
      if (!animationFrame) return;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const animate = () => {
      const nextScrollTop = currentScrollTop + (targetScrollTop - currentScrollTop) * SCROLL_EASING;
      const distance = targetScrollTop - nextScrollTop;

      if (Math.abs(distance) <= STOP_THRESHOLD) {
        currentScrollTop = targetScrollTop;
        scrollContainer.scrollTop = targetScrollTop;
        animationFrame = 0;
        return;
      }

      currentScrollTop = nextScrollTop;
      scrollContainer.scrollTop = nextScrollTop;
      animationFrame = requestAnimationFrame(animate);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return;

      const rawDelta = getWheelDeltaY(event, scrollContainer);
      if (Math.abs(rawDelta) < 1) return;

      const wheelStep = Math.min(Math.max(rawDelta, -MAX_WHEEL_STEP), MAX_WHEEL_STEP);
      const nextTarget = clampScrollTop(targetScrollTop + wheelStep, scrollContainer);
      if (nextTarget === targetScrollTop) return;

      event.preventDefault();
      currentScrollTop = scrollContainer.scrollTop;
      targetScrollTop = nextTarget;

      if (!animationFrame) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const onScroll = () => {
      if (animationFrame) return;
      currentScrollTop = scrollContainer.scrollTop;
      targetScrollTop = scrollContainer.scrollTop;
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stopAnimation();
      scrollContainer.removeEventListener("wheel", onWheel);
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, [enabled, scrollContainer]);
}
