import type { GridCardFrame, GridMetrics } from "@/types/playlist/grid";

// The card under the pane centre grows a little; everything else shrinks and fades towards the edge.
const CENTER_SCALE = 1.1;
const MIN_SCALE = 0.45;
const MIN_OPACITY = 0.4;
/** A card within this many pixels of the pane centre is the focused one. */
const CENTER_RADIUS = 40;

/**
 * Visual state of a card whose centre sits `dx`, `dy` pixels from the pane centre. Cards outside the
 * pane are hidden so the wall only pays for what can be seen.
 */
export function computeCardFrame(
  dx: number,
  dy: number,
  viewportWidth: number,
  viewportHeight: number,
  metrics: GridMetrics,
): GridCardFrame {
  const distance = Math.hypot(dx, dy);
  const progress = Math.min(distance / Math.max(metrics.maxDistance, 1), 1);
  const visible =
    Math.abs(dx) <= viewportWidth / 2 + metrics.cardWidth / 2 &&
    Math.abs(dy) <= viewportHeight / 2 + metrics.cardHeight / 2;
  return {
    visible,
    scale: CENTER_SCALE - (CENTER_SCALE - MIN_SCALE) * progress,
    opacity: 1 - (1 - MIN_OPACITY) * progress,
    zIndex: Math.round(50 - 49 * progress),
    centered: distance < CENTER_RADIUS,
  };
}
