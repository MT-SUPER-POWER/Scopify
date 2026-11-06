import { BRAVAIS_METRICS } from "@/constants/playlistBravais";
import {
  getInstanceBlock,
  getLatticeGeometry,
  layoutLattice,
  locateNearestInstance,
} from "@/lib/playlist/lattice/layout";
import type { BravaisSeat, BravaisWall } from "@/types/playlist/bravais";
import type { Bounds, QueueInstance } from "@/types/playlist/lattice";
import type { SongDetail } from "@/types/song/api";

// Blocks abut, so the gap midline sits half a gap before the boundary column's first seat.
const boundaryXFor = (column: number, blockWidth: number) =>
  column * blockWidth - BRAVAIS_METRICS.gap / 2;

/**
 * The endless wall is the Lattice block layout: one pass over the songs fills a cell, and the cell
 * repeats in every direction. The seam sits on the block column nearest the middle at first.
 */
export function createBravaisWall(trackCount: number, anchorColumn?: number): BravaisWall {
  const geometry = getLatticeGeometry(Math.max(trackCount, 1), BRAVAIS_METRICS);
  const anchor = anchorColumn ?? Math.floor(geometry.blocksPerRow / 2);
  return {
    geometry,
    trackCount,
    anchorColumn: anchor,
    boundaryX: boundaryXFor(anchor, geometry.blockWidth),
  };
}

/** Seats whose tile can touch the pane; `overscan` is world pixels on every side. */
export function bravaisSeatsIn(wall: BravaisWall, bounds: Bounds, overscan: number): BravaisSeat[] {
  return layoutLattice(wall.geometry, wall.trackCount, bounds, overscan, BRAVAIS_METRICS).map(
    (instance) => ({
      instance,
      trackIndex: instance.queueIndex,
      side: getInstanceBlock(wall.geometry, instance).column < wall.anchorColumn ? "left" : "right",
    }),
  );
}

/** The side of the seam a seat of this wall is on. */
export function bravaisSideOf(wall: BravaisWall, instance: QueueInstance): "left" | "right" {
  return getInstanceBlock(wall.geometry, instance).column < wall.anchorColumn ? "left" : "right";
}

/** The copy of a song closest to a world point; the wall repeats, so there are many. */
export function nearestBravaisInstance(
  wall: BravaisWall,
  index: number,
  point: { x: number; y: number },
): QueueInstance | null {
  return locateNearestInstance(wall.geometry, wall.trackCount, index, point, BRAVAIS_METRICS);
}

/** The block boundary nearest to a world x, where the seam may open. */
export function nearestSeamColumn(wall: BravaisWall, worldX: number): number {
  return Math.round((worldX + BRAVAIS_METRICS.gap / 2) / wall.geometry.blockWidth);
}

/** World x of the gap midline a seam on `column` opens on. */
export function seamBoundaryX(wall: BravaisWall, column: number): number {
  return boundaryXFor(column, wall.geometry.blockWidth);
}

/**
 * Maps an x on screen-world (where the seam has pushed the halves apart by `seam` world pixels) back
 * to the wall's own layout x. Inside the seam itself it maps to the boundary.
 */
export function unshiftWallX(wall: BravaisWall, seam: number, x: number): number {
  if (x <= wall.boundaryX - seam / 2) return x + seam / 2;
  if (x >= wall.boundaryX + seam / 2) return x - seam / 2;
  return wall.boundaryX;
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
