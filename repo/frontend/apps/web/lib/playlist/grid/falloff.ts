import type { GridCardFrame, GridMetrics } from "@/types/playlist/grid";

// Depth comes from the curve itself, so size barely changes with distance; the sides fall off in light.
const CENTER_SCALE = 1.04;
const MIN_SCALE = 0.92;
const MIN_OPACITY = 0.4;
/** A card within this many pixels of the pane centre is the focused one. */
const CENTER_RADIUS = 40;
// The curve pulls the edges in, so cards beyond the pane edge can still land on screen.
const VISIBLE_MARGIN = 1.6;

/**
 * Visual state of a card whose centre sits `dx`, `dy` pixels from the pane centre. Cards well outside
 * the pane are hidden so the wall only pays for what can be seen.
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
    Math.abs(dx) <= (viewportWidth / 2 + metrics.cardWidth / 2) * VISIBLE_MARGIN &&
    Math.abs(dy) <= viewportHeight / 2 + metrics.cardHeight / 2;
  return {
    visible,
    scale: CENTER_SCALE - (CENTER_SCALE - MIN_SCALE) * progress,
    progress,
    opacity: 1 - (1 - MIN_OPACITY) * progress,
    zIndex: Math.round(50 - 49 * progress),
    centered: distance < CENTER_RADIUS,
  };
}

/** Radius of the screen's curve, as a multiple of the pane width. Smaller is a deeper curve. */
const CURVE_RADIUS = 0.8;
/** Widest turn; beyond it a card would be edge-on to the viewer. */
const MAX_TURN = 1.25;

/**
 * Placement of a card on a concave cylinder, like a curved ultrawide monitor with the viewer at its
 * middle. A card `dx` world pixels from the pane centre sits on the arc at the angle that distance
 * subtends, so spacing along the screen is kept; it is turned by that same angle about its vertical
 * axis to face the middle, and the arc brings the sides towards the viewer.
 *
 * The curve belongs to the screen, so it is measured in screen pixels and handed back in world ones:
 * `x` is how far to move the card sideways from its flat position, `z` how far towards the viewer.
 */
export function computeCardCurve(dx: number, scale: number, viewportWidth: number) {
  const radius = Math.max(viewportWidth * CURVE_RADIUS, 1);
  const turn = Math.max(-MAX_TURN, Math.min(MAX_TURN, (dx * scale) / radius));
  return {
    x: (radius * Math.sin(turn)) / scale - dx,
    z: (radius * (1 - Math.cos(turn))) / scale,
    rotateY: (-turn * 180) / Math.PI,
  };
}
