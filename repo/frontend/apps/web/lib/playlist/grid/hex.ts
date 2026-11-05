import type { Bounds } from "@/types/playlist/lattice";
import type { GridCell, GridDirection, GridMetrics } from "@/types/playlist/grid";

type Cube = { x: number; z: number };

// Side directions walked clockwise around a ring of the hex spiral.
const RING_STEPS: readonly Cube[] = [
  { x: 0, z: -1 },
  { x: -1, z: 0 },
  { x: -1, z: 1 },
  { x: 0, z: 1 },
  { x: 1, z: 0 },
  { x: 1, z: -1 },
];

/** Cell of `index` on the centre-out hex spiral; index 0 is the origin and each ring follows. */
function cubeAtIndex(index: number): Cube {
  if (index <= 0) return { x: 0, z: 0 };
  let radius = 1;
  while (index >= 1 + 3 * radius * (radius + 1)) radius++;
  const offset = index - (1 + 3 * (radius - 1) * radius);
  const side = Math.floor(offset / radius);
  const steps = (offset % radius) + 1;
  // Ring start is (radius, -radius, 0) in cube space, i.e. x = radius, z = 0.
  let x = radius;
  let z = 0;
  for (let done = 0; done < side; done++) {
    x += RING_STEPS[done].x * radius;
    z += RING_STEPS[done].z * radius;
  }
  x += RING_STEPS[side].x * steps;
  z += RING_STEPS[side].z * steps;
  return { x, z };
}

/** Lays `count` tracks out on a hex spiral, playlist order running outward from the middle. */
export function layoutHexWall(count: number, metrics: GridMetrics): GridCell[] {
  const cells: GridCell[] = [];
  for (let index = 0; index < count; index++) {
    const cube = cubeAtIndex(index);
    cells.push({
      index,
      x: cube.x * metrics.spacingX + (cube.z * metrics.spacingX) / 2,
      y: cube.z * metrics.spacingY,
    });
  }
  return cells;
}

/** Cells whose card could touch the viewport once `overscan` world pixels are added on every side. */
export function cullHexWall(
  cells: readonly GridCell[],
  bounds: Bounds,
  metrics: GridMetrics,
  overscan: number,
): GridCell[] {
  const halfWidth = metrics.cardWidth / 2 + overscan;
  const halfHeight = metrics.cardHeight / 2 + overscan;
  return cells.filter(
    (cell) =>
      cell.x + halfWidth >= bounds.left &&
      cell.x - halfWidth <= bounds.right &&
      cell.y + halfHeight >= bounds.top &&
      cell.y - halfHeight <= bounds.bottom,
  );
}

/** Closest card to a world point. */
export function nearestHexCell(cells: readonly GridCell[], x: number, y: number): GridCell | null {
  let best: GridCell | null = null;
  let bestDistance = Infinity;
  for (const cell of cells) {
    const distance = (cell.x - x) ** 2 + (cell.y - y) ** 2;
    if (distance < bestDistance) {
      best = cell;
      bestDistance = distance;
    }
  }
  return best;
}

/** The neighbour a directional key should move to: forward first, then the smallest sideways drift. */
export function adjacentHexCell(
  cells: readonly GridCell[],
  from: GridCell,
  direction: GridDirection,
  metrics: GridMetrics,
): GridCell | null {
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "right" || direction === "down" ? 1 : -1;
  const step = horizontal ? metrics.spacingX : metrics.spacingY;
  let best: GridCell | null = null;
  let bestScore = Infinity;
  for (const cell of cells) {
    const dx = cell.x - from.x;
    const dy = cell.y - from.y;
    const along = (horizontal ? dx : dy) * sign;
    if (along < step * 0.4) continue;
    const across = Math.abs(horizontal ? dy : dx);
    const score = along + across * 2;
    if (score < bestScore) {
      best = cell;
      bestScore = score;
    }
  }
  return best;
}
