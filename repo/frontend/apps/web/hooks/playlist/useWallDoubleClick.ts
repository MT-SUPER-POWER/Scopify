"use client";

import { useRef } from "react";
import type { MouseEvent } from "react";

function trackTarget(event: MouseEvent<HTMLElement>) {
  const target = event.target;
  if (!(target instanceof Element) || target.closest("button, input, a, [role='slider']")) {
    return null;
  }
  return target.closest<HTMLElement>("[data-wall-track]");
}

/** A layout can move under the pointer on the first click. Only play if both clicks hit one card. */
export function useWallDoubleClick() {
  const first = useRef<HTMLElement | null>(null);
  const second = useRef<HTMLElement | null>(null);

  return {
    note(event: MouseEvent<HTMLElement>, enabled = true) {
      const target = enabled && !event.defaultPrevented ? trackTarget(event) : null;
      if (event.detail === 1) {
        first.current = target;
        second.current = null;
      } else if (event.detail === 2) second.current = target;
    },
    take(event: MouseEvent<HTMLElement>) {
      const target = trackTarget(event);
      const valid = target && target === first.current && target === second.current;
      first.current = null;
      second.current = null;
      return valid ? target : null;
    },
  };
}
