import type { KeyboardEvent } from "react";

/** Step of one zoom button press or key press. */
export const ZOOM_STEP = 1.25;

/** +1 / -1 for the zoom-in / zoom-out keys (with or without Shift, main row or numpad), else 0. */
export function zoomKeyDirection(event: KeyboardEvent<HTMLElement>): 1 | -1 | 0 {
  if (event.altKey || event.ctrlKey || event.metaKey) return 0;
  if (event.key === "+" || event.key === "=") return 1;
  if (event.key === "-" || event.key === "_") return -1;
  return 0;
}
