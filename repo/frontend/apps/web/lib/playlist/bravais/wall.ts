import { BRAVAIS_EDGE_MARGIN, BRAVAIS_METRICS } from "@/constants/playlistBravais";
import { SLOTS_PER_BLOCK } from "@/constants/playlistLattice/blockTemplates";
import { getLatticeGeometry, locateInstanceAt } from "@/lib/playlist/lattice/layout";
import type { BravaisWall } from "@/types/playlist/bravais";
import type { Bounds, LatticeCamera, LatticeViewport } from "@/types/playlist/lattice";
import type { SongDetail } from "@/types/song/api";

// Blocks abut, so the gap midline sits half a gap before the boundary column's first seat.
const boundaryXFor = (column: number, blockWidth: number) =>
  column * blockWidth - BRAVAIS_METRICS.gap / 2;

/**
 * Lays the tracks out once over the lattice blocks, in playlist order. Unlike the endless Lattice
 * the wall is finite: one pass over the songs, with the seam on the block column nearest the middle.
 */
export function buildBravaisWall(trackCount: number, anchor?: number): BravaisWall {
  const metrics = BRAVAIS_METRICS;
  const geometry = getLatticeGeometry(Math.max(trackCount, 1), metrics);
  const anchorColumn = anchor ?? Math.floor(geometry.blocksPerRow / 2);
  const seats: BravaisWall["seats"] = [];
  const blocks = geometry.blocksPerRow * geometry.blockRows;
  for (let block = 0; block < blocks; block++) {
    const column = block % geometry.blocksPerRow;
    const row = Math.floor(block / geometry.blocksPerRow);
    for (let slot = 0; slot < SLOTS_PER_BLOCK; slot++) {
      const instance = locateInstanceAt(
        geometry,
        Math.max(trackCount, 1),
        column,
        row,
        slot,
        metrics,
      );
      if (!instance) continue;
      const trackIndex = block * SLOTS_PER_BLOCK + slot;
      seats.push({
        instance,
        trackIndex: trackIndex < trackCount ? trackIndex : -1,
        side: column < anchorColumn ? "left" : "right",
      });
    }
  }
  return {
    seats,
    anchorColumn,
    blocksPerRow: geometry.blocksPerRow,
    blockWidth: geometry.blockWidth,
    boundaryX: boundaryXFor(anchorColumn, geometry.blockWidth),
    width: geometry.cellWidth,
    height: geometry.cellHeight,
  };
}

/**
 * The block boundary nearest to a world x where the seam may open. The wall's own edges count: a
 * seam there is a panel standing beside the wall, which keeps it near a small wall's far ends.
 */
export function nearestSeamColumn(wall: BravaisWall, worldX: number): number {
  const column = Math.round((worldX + BRAVAIS_METRICS.gap / 2) / wall.blockWidth);
  return Math.min(wall.blocksPerRow, Math.max(0, column));
}

/** Seats whose tile can touch the pane; `overscan` is world pixels on every side. */
export function cullBravaisSeats(wall: BravaisWall, bounds: Bounds, overscan: number) {
  return wall.seats.filter(
    ({ instance }) =>
      instance.x + instance.width + overscan >= bounds.left &&
      instance.x - overscan <= bounds.right &&
      instance.y + instance.height + overscan >= bounds.top &&
      instance.y - overscan <= bounds.bottom,
  );
}

/**
 * How far the seam pushes things at an opening of `seam` pixels. Mid-wall the two halves each give
 * way by half; at a wall edge the whole wall gives way, so the seam stands beside it instead of
 * straddling the edge with half of it hanging into empty space.
 */
export function seamShift(wall: BravaisWall, seam: number) {
  const start = wall.anchorColumn === 0;
  const end = wall.anchorColumn === wall.blocksPerRow;
  return {
    left: end ? -seam : -seam / 2,
    right: start ? seam : seam / 2,
    // Offset of the seam's centre from the boundary.
    center: start ? seam / 2 : end ? -seam / 2 : 0,
  };
}

/**
 * Maps an x on screen-world (where the seam has pushed the halves apart) back to the wall's own
 * layout x. Inside the seam itself it maps to the boundary.
 */
export function unshiftWallX(wall: BravaisWall, seam: number, x: number): number {
  const shift = seamShift(wall, seam);
  if (x <= wall.boundaryX + shift.left) return x - shift.left;
  if (x >= wall.boundaryX + shift.right) return x - shift.right;
  return wall.boundaryX;
}

/** Keeps the wall within reach: it may overshoot the pane edge by the margin, and centres if it is smaller. */
export function clampBravaisCamera(
  camera: LatticeCamera,
  viewport: LatticeViewport,
  wall: BravaisWall,
  seamWidth: number,
): LatticeCamera {
  const clampAxis = (offset: number, view: number, size: number, leading: number) => {
    // `leading` is how far the content's first pixel sits before world 0 (the seam pushes the left half out).
    const edge = offset - leading;
    const total = size;
    if (total + 2 * BRAVAIS_EDGE_MARGIN <= view) return (view - total) / 2 + leading;
    return (
      Math.min(BRAVAIS_EDGE_MARGIN, Math.max(view - total - BRAVAIS_EDGE_MARGIN, edge)) + leading
    );
  };
  return {
    ...camera,
    // With the seam on the wall's start edge nothing is pushed out to the left of world 0.
    x: clampAxis(
      camera.x,
      viewport.width,
      wall.width + seamWidth,
      wall.anchorColumn === 0 ? 0 : -seamShift(wall, seamWidth).left,
    ),
    y: clampAxis(camera.y, viewport.height, wall.height, 0),
  };
}

/** Whether a track matches the seam's filter box (name, artist or album). */
export function matchesTrackFilter(track: SongDetail, query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    track.name.toLowerCase().includes(needle) ||
    track.al.name.toLowerCase().includes(needle) ||
    track.ar.some((artist) => artist.name.toLowerCase().includes(needle))
  );
}
