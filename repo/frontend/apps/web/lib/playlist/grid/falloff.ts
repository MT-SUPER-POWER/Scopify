import type { GridCardFrame, GridMetrics } from "@/types/playlist/grid";

// The card under the pane centre grows a little; everything else shrinks and fades towards the edge.
const CENTER_SCALE = 1.1;
const MIN_SCALE = 0.7;
const MIN_OPACITY = 0.3;
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
    progress,
    opacity: 1 - (1 - MIN_OPACITY) * progress,
    zIndex: Math.round(50 - 49 * progress),
    centered: distance < CENTER_RADIUS,
  };
}

/** How strongly the wall bends: radius of the screen's curve, as a multiple of the pane width. */
const CURVE_RADIUS = 0.62;
/** The bend is gentler vertically, like an ultrawide panel rather than a bowl. */
const VERTICAL_CURVE = 0.5;
/** Edge cards come towards the viewer by this share of the sagitta of the curve. */
const CURVE_DEPTH = 0.55;
/** The focused card stands a little in front of its neighbours. */
const CENTER_LIFT = 70;
/** Widest turn, so cards near the pane corner stay readable. */
const MAX_TURN = 1.1;

/**
 * Concave, curved-monitor placement of a card `dx`, `dy` world pixels from the pane centre at the
 * given zoom: cards turn to face the middle and the sides come towards the viewer. `progress` is how
 * far the card is from the middle (0 to 1), which lifts the focused one.
 */
export function computeCardCurve(
  dx: number,
  dy: number,
  scale: number,
  viewportWidth: number,
  progress: number,
) {
  // The curve is a property of the screen, so it is measured in screen pixels and handed back in world ones.
  const radius = Math.max(viewportWidth * CURVE_RADIUS, 1);
  const turnY = Math.max(-MAX_TURN, Math.min(MAX_TURN, (dx * scale) / radius));
  const turnX = Math.max(-MAX_TURN, Math.min(MAX_TURN, ((dy * scale) / radius) * VERTICAL_CURVE));
  const sag = 1 - Math.cos(turnY) + (1 - Math.cos(turnX)) * VERTICAL_CURVE;
  return {
    rotateY: (-turnY * 180) / Math.PI,
    rotateX: (turnX * 180) / Math.PI,
    z: (sag * radius * CURVE_DEPTH + (1 - progress) * CENTER_LIFT) / scale,
  };
}
