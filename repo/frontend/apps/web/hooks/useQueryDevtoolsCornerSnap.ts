"use client";

import { useEffect, useState } from "react";

import type { RefObject } from "react";

import type {
  QueryDevtoolsActivePointer,
  QueryDevtoolsCorner,
} from "@/types/components/queryDevtools";

const CORNER_STORAGE_KEY = "scopify-query-devtools-corner";
const DRAG_THRESHOLD_PX = 6;

function getCornerAtPoint(clientX: number, clientY: number): QueryDevtoolsCorner {
  const horizontal = clientX < window.innerWidth / 2 ? "left" : "right";
  const vertical = clientY < window.innerHeight / 2 ? "top" : "bottom";

  if (vertical === "top") {
    return horizontal === "left" ? "top-left" : "top-right";
  }

  return horizontal === "left" ? "bottom-left" : "bottom-right";
}

function getSavedCorner(): QueryDevtoolsCorner {
  if (typeof window === "undefined") return "bottom-right";

  const savedCorner = window.localStorage.getItem(CORNER_STORAGE_KEY);
  if (
    savedCorner === "top-left" ||
    savedCorner === "top-right" ||
    savedCorner === "bottom-left" ||
    savedCorner === "bottom-right"
  ) {
    return savedCorner;
  }

  return "bottom-right";
}

/** Lets the native Devtools button choose one of its four supported corners on drag. */
export function useQueryDevtoolsCornerSnap(containerRef: RefObject<HTMLDivElement | null>) {
  const [corner, setCorner] = useState<QueryDevtoolsCorner>(getSavedCorner);

  useEffect(() => {
    window.localStorage.setItem(CORNER_STORAGE_KEY, corner);
  }, [corner]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let boundButton: HTMLButtonElement | undefined;
    let cleanupButton: (() => void) | undefined;

    const bindButton = () => {
      const button = container.querySelector<HTMLButtonElement>(".tsqd-open-btn");
      if (button === boundButton) return;

      cleanupButton?.();
      if (!button) return;

      boundButton = button;
      let activePointer: QueryDevtoolsActivePointer | undefined;
      let suppressClick = false;
      const previousTouchAction = button.style.touchAction;
      button.style.touchAction = "none";

      const releasePointer = (event: PointerEvent) => {
        if (!activePointer || event.pointerId !== activePointer.pointerId) return;

        if (button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }

        if (activePointer.hasDragged) {
          suppressClick = true;
          setCorner(getCornerAtPoint(event.clientX, event.clientY));
          window.setTimeout(() => {
            suppressClick = false;
          }, 0);
        }

        activePointer = undefined;
      };

      const handlePointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;

        activePointer = {
          hasDragged: false,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
        };
        button.setPointerCapture(event.pointerId);
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!activePointer || event.pointerId !== activePointer.pointerId) return;

        if (
          Math.hypot(event.clientX - activePointer.startX, event.clientY - activePointer.startY) >=
          DRAG_THRESHOLD_PX
        ) {
          activePointer.hasDragged = true;
          event.preventDefault();
        }
      };

      const preventClickAfterDrag = (event: MouseEvent) => {
        if (!suppressClick) return;

        event.preventDefault();
        event.stopImmediatePropagation();
      };

      button.addEventListener("pointerdown", handlePointerDown);
      button.addEventListener("pointermove", handlePointerMove);
      button.addEventListener("pointerup", releasePointer);
      button.addEventListener("pointercancel", releasePointer);
      button.addEventListener("click", preventClickAfterDrag, true);

      cleanupButton = () => {
        button.style.touchAction = previousTouchAction;
        button.removeEventListener("pointerdown", handlePointerDown);
        button.removeEventListener("pointermove", handlePointerMove);
        button.removeEventListener("pointerup", releasePointer);
        button.removeEventListener("pointercancel", releasePointer);
        button.removeEventListener("click", preventClickAfterDrag, true);
        boundButton = undefined;
        cleanupButton = undefined;
      };
    };

    const observer = new MutationObserver(bindButton);
    observer.observe(container, { childList: true, subtree: true });
    bindButton();

    return () => {
      observer.disconnect();
      cleanupButton?.();
    };
  }, [containerRef]);

  return corner;
}
