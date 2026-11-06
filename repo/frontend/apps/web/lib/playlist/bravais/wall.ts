import {
  BRAVAIS_BLOCK_UNITS,
  BRAVAIS_GAP,
  BRAVAIS_SLOTS_PER_BLOCK,
  BRAVAIS_TEMPLATES,
} from "@/constants/playlistBravais";
import type { BravaisSeat, BravaisSide, BravaisWall } from "@/types/playlist/bravais";
import type { SongDetail } from "@/types/song/api";

/** Which way a halve moves with the camera: the right one rolls against the left. */
export const bravaisSideSign = (side: BravaisSide) => (side === "left" ? 1 : -1);

/** Sizes the wall to the space beside the list; one pass over the songs flows down both halves. */
export function createBravaisWall(
  trackCount: number,
  paneWidth: number,
  panelWidth: number,
  columns: number,
): BravaisWall {
  const sideWidth = Math.max(0, (paneWidth - panelWidth) / 2 - BRAVAIS_GAP * 2);
  const unit = (sideWidth + BRAVAIS_GAP) / (columns * BRAVAIS_BLOCK_UNITS);
  const blockSize = unit * BRAVAIS_BLOCK_UNITS;
  const blocks = Math.max(1, Math.ceil(trackCount / BRAVAIS_SLOTS_PER_BLOCK));
  const blockRows = Math.ceil(blocks / (columns * 2));
  return {
    trackCount,
    columns,
    sideWidth,
    unit,
    blockSize,
    blockRows,
    cellHeight: blockRows * blockSize,
    cellSlots: columns * 2 * blockRows * BRAVAIS_SLOTS_PER_BLOCK,
  };
}

/** `column` counts across both halves; `row` is unbounded, since the wall repeats downwards. */
const buildSeat = (
  wall: BravaisWall,
  column: number,
  row: number,
  slotIndex: number,
): BravaisSeat => {
  const repeatY = Math.floor(row / wall.blockRows);
  const localRow = row - repeatY * wall.blockRows;
  const cellSlot = (localRow * wall.columns * 2 + column) * BRAVAIS_SLOTS_PER_BLOCK + slotIndex;
  const template = BRAVAIS_TEMPLATES[(column + localRow * 2) % BRAVAIS_TEMPLATES.length];
  const slot = template[slotIndex];
  const side: BravaisSide = column < wall.columns ? "left" : "right";
  const sideColumn = side === "left" ? column : column - wall.columns;
  return {
    side,
    instance: {
      instanceId: `${cellSlot}:${repeatY}`,
      queueIndex: cellSlot % wall.trackCount,
      cellSlot,
      repeatX: 0,
      repeatY,
      x: sideColumn * wall.blockSize + slot.x * wall.unit,
      y: row * wall.blockSize + slot.y * wall.unit,
      width: slot.cols * wall.unit - BRAVAIS_GAP,
      height: slot.rows * wall.unit - BRAVAIS_GAP,
    },
  };
};

/** The tiles of both halves that can touch a pane of `height` with the camera at `cameraY`. */
export function bravaisSeatsIn(
  wall: BravaisWall,
  cameraY: number,
  height: number,
  overscan: number,
): BravaisSeat[] {
  if (wall.trackCount <= 0 || wall.blockSize <= 0) return [];
  const seats: BravaisSeat[] = [];
  for (let column = 0; column < wall.columns * 2; column += 1) {
    const top = -bravaisSideSign(column < wall.columns ? "left" : "right") * cameraY;
    const fromRow = Math.floor((top - overscan) / wall.blockSize);
    const toRow = Math.floor((top + height + overscan) / wall.blockSize);
    for (let row = fromRow; row <= toRow; row += 1) {
      for (let slotIndex = 0; slotIndex < BRAVAIS_SLOTS_PER_BLOCK; slotIndex += 1) {
        seats.push(buildSeat(wall, column, row, slotIndex));
      }
    }
  }
  return seats;
}

/** The copy of a song nearest the middle of the pane; the wall repeats, so there are many. */
export function nearestBravaisSeat(
  wall: BravaisWall,
  index: number,
  cameraY: number,
  height: number,
): BravaisSeat | null {
  if (index < 0 || index >= wall.trackCount || wall.blockSize <= 0) return null;
  let best: BravaisSeat | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let cellSlot = index; cellSlot < wall.cellSlots; cellSlot += wall.trackCount) {
    const block = Math.floor(cellSlot / BRAVAIS_SLOTS_PER_BLOCK);
    const column = block % (wall.columns * 2);
    const localRow = Math.floor(block / (wall.columns * 2));
    const slotIndex = cellSlot % BRAVAIS_SLOTS_PER_BLOCK;
    const base = buildSeat(wall, column, localRow, slotIndex);
    const shift = bravaisSideSign(base.side) * cameraY;
    const offset = height / 2 - base.instance.height / 2 - base.instance.y - shift;
    const repeat = Math.round(offset / wall.cellHeight);
    const seat = buildSeat(wall, column, localRow + repeat * wall.blockRows, slotIndex);
    const distance = Math.abs(offset - repeat * wall.cellHeight);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = seat;
    }
  }
  return best;
}

/** Camera y that shows a tile: one already in full view stays put, another comes to the middle. */
export function revealBravaisSeat(seat: BravaisSeat, cameraY: number, height: number): number {
  const sign = bravaisSideSign(seat.side);
  const { y, height: tileHeight } = seat.instance;
  const top = sign * cameraY + y;
  if (top >= 0 && top + tileHeight <= height) return cameraY;
  return sign * ((height - tileHeight) / 2 - y);
}

/** Whether a track matches the list's filter box (name, artist or album). */
export function matchesTrackFilter(track: SongDetail, query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    track.name.toLowerCase().includes(needle) ||
    track.al.name.toLowerCase().includes(needle) ||
    track.ar.some((artist) => artist.name.toLowerCase().includes(needle))
  );
}
