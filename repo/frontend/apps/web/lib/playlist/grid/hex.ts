import type { Bounds } from "@/types/playlist/lattice";
import type { GridCell, GridDirection, GridMetrics } from "@/types/playlist/grid";

// Ceiling on cards built for one viewport, so an extreme zoom-out cannot stall a frame.
const MAX_CELLS = 700;

const mod = (value: number, size: number) => ((value % size) + size) % size;

/** Songs advance by one per column and by this many per row, so a row-sized window shows a run of the list. */
export const hexStride = (count: number) => Math.max(1, Math.round(Math.sqrt(count)));

/** Odd rows are shifted half a column to the right, which makes the wall a hex lattice. */
const rowShift = (row: number, metrics: GridMetrics) =>
  mod(row, 2) === 1 ? metrics.spacingX / 2 : 0;

/**
 * Builds (or reuses) the cell at a column and row. The playlist repeats endlessly: the song at a cell
 * is its position along the stride, wrapped by the track count.
 */
export function hexCellAt(
  col: number,
  row: number,
  count: number,
  metrics: GridMetrics,
  cache: Map<string, GridCell>,
): GridCell {
  const key = `${col}:${row}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const cell: GridCell = {
    key,
    col,
    row,
    x: col * metrics.spacingX + rowShift(row, metrics),
    y: row * metrics.spacingY,
    index: mod(col + row * hexStride(count), count),
  };
  cache.set(key, cell);
  return cell;
}

/** Cells whose card can touch the viewport once `overscan` world pixels are added on every side. */
export function visibleHexCells(
  bounds: Bounds,
  count: number,
  metrics: GridMetrics,
  overscan: number,
  cache: Map<string, GridCell>,
): GridCell[] {
  if (count <= 0) return [];
  const halfWidth = metrics.cardWidth / 2 + overscan;
  const halfHeight = metrics.cardHeight / 2 + overscan;
  const firstRow = Math.floor((bounds.top - halfHeight) / metrics.spacingY);
  const lastRow = Math.ceil((bounds.bottom + halfHeight) / metrics.spacingY);
  const cells: GridCell[] = [];
  for (let row = firstRow; row <= lastRow; row++) {
    const shift = rowShift(row, metrics);
    const firstCol = Math.floor((bounds.left - halfWidth - shift) / metrics.spacingX);
    const lastCol = Math.ceil((bounds.right + halfWidth - shift) / metrics.spacingX);
    for (let col = firstCol; col <= lastCol; col++) {
      cells.push(hexCellAt(col, row, count, metrics, cache));
      if (cells.length >= MAX_CELLS) return cells;
    }
  }
  return cells;
}

/** The cell showing `index` that is closest to a world point; the wall repeats, so there are many. */
export function locateHexCell(
  index: number,
  count: number,
  point: { x: number; y: number },
  metrics: GridMetrics,
  cache: Map<string, GridCell>,
): GridCell {
  const stride = hexStride(count);
  const centreRow = Math.round(point.y / metrics.spacingY);
  let best: GridCell | null = null;
  let bestDistance = Infinity;
  // A song recurs every `count` columns of a row, and its column shifts by `stride` from row to row.
  for (let row = centreRow - 4; row <= centreRow + 4; row++) {
    const base = mod(index - row * stride, count);
    const target = Math.round((point.x - rowShift(row, metrics)) / metrics.spacingX);
    const col = base + Math.round((target - base) / count) * count;
    for (const candidate of [col - count, col, col + count]) {
      const cell = hexCellAt(candidate, row, count, metrics, cache);
      const distance = (cell.x - point.x) ** 2 + (cell.y - point.y) ** 2;
      if (distance < bestDistance) {
        best = cell;
        bestDistance = distance;
      }
    }
  }
  return best ?? hexCellAt(0, 0, count, metrics, cache);
}

/** The neighbour a directional key moves to; vertical steps keep the column, which leans half a column to one side. */
export function adjacentHexCell(
  from: GridCell,
  direction: GridDirection,
  count: number,
  metrics: GridMetrics,
  cache: Map<string, GridCell>,
): GridCell {
  if (direction === "left") return hexCellAt(from.col - 1, from.row, count, metrics, cache);
  if (direction === "right") return hexCellAt(from.col + 1, from.row, count, metrics, cache);
  return hexCellAt(from.col, from.row + (direction === "down" ? 1 : -1), count, metrics, cache);
}
