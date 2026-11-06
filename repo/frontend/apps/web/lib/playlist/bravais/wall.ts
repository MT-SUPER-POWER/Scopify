import { BRAVAIS_METRICS, BRAVAIS_PANEL_INSET } from "@/constants/playlistBravais";
import {
  getLatticeGeometry,
  layoutLattice,
  locateNearestInstance,
} from "@/lib/playlist/lattice/layout";
import type { BravaisWall } from "@/types/playlist/bravais";
import type {
  Bounds,
  LatticeCamera,
  LatticeViewport,
  QueueInstance,
} from "@/types/playlist/lattice";
import type { SongDetail } from "@/types/song/api";

/**
 * The endless wall is the Lattice block layout: one pass over the songs fills a cell, and the cell
 * repeats in every direction. It starts with a block boundary behind the panel, so the panel hides
 * the join between two blocks rather than the middle of one.
 */
export function createBravaisWall(trackCount: number): BravaisWall {
  const geometry = getLatticeGeometry(Math.max(trackCount, 1), BRAVAIS_METRICS);
  return {
    geometry,
    trackCount,
    originX: Math.floor(geometry.blocksPerRow / 2) * geometry.blockWidth - BRAVAIS_METRICS.gap / 2,
  };
}

/** Tiles that can touch the pane; `overscan` is world pixels on every side. */
export function bravaisTilesIn(
  wall: BravaisWall,
  bounds: Bounds,
  overscan: number,
): QueueInstance[] {
  return layoutLattice(wall.geometry, wall.trackCount, bounds, overscan, BRAVAIS_METRICS);
}

/** The copy of a song closest to a world point; the wall repeats, so there are many. */
export function nearestBravaisInstance(
  wall: BravaisWall,
  index: number,
  point: { x: number; y: number },
): QueueInstance | null {
  return locateNearestInstance(wall.geometry, wall.trackCount, index, point, BRAVAIS_METRICS);
}

/**
 * Where the camera has to be for a tile to be seen beside the pinned panel. A tile already in full
 * view stays put; otherwise it goes to whichever side of the panel is the shorter trip, centred in
 * that side. A tile wider than the side shows its left part, which holds its number and title.
 */
export function revealBravaisTile(
  tile: QueueInstance,
  camera: LatticeCamera,
  view: LatticeViewport,
  panelWidth: number,
): { x: number; y: number } {
  const { x, y, scale } = camera;
  const left = x + tile.x * scale;
  const top = y + tile.y * scale;
  const width = tile.width * scale;
  const height = tile.height * scale;
  const side = (view.width - panelWidth) / 2 - BRAVAIS_PANEL_INSET;
  const sideRight = view.width - side;
  const fitsAcross =
    (left >= 0 && left + width <= side) || (left >= sideRight && left + width <= view.width);
  const fitsDown = top >= 0 && top + height <= view.height;
  let nextX = x;
  if (!fitsAcross) {
    const spare = side - width;
    const toLeft = Math.max(0, spare / 2) - left;
    const toRight = sideRight + Math.max(0, spare / 2) - left;
    nextX = x + (Math.abs(toLeft) <= Math.abs(toRight) ? toLeft : toRight);
  }
  return {
    x: nextX,
    y: fitsDown ? y : (view.height - height) / 2 - tile.y * scale,
  };
}

/** Whether a track matches the panel's filter box (name, artist or album). */
export function matchesTrackFilter(track: SongDetail, query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    track.name.toLowerCase().includes(needle) ||
    track.al.name.toLowerCase().includes(needle) ||
    track.ar.some((artist) => artist.name.toLowerCase().includes(needle))
  );
}
