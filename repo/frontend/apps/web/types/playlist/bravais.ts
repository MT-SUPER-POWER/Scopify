import type { LatticeGeometry, QueueInstance } from "@/types/playlist/lattice";

/** One poster on the endless wall; the playlist repeats, so a song owns many seats. */
export interface BravaisSeat {
  instance: QueueInstance;
  /** Index into the page's tracks. */
  trackIndex: number;
  /** Which side of the seam the seat belongs to. */
  side: "left" | "right";
}

/** Wall geometry plus the block column whose left edge the seam currently opens on. */
export interface BravaisWall {
  geometry: LatticeGeometry;
  trackCount: number;
  anchorColumn: number;
  /** World x of the gap midline the seam opens on; it is always a block boundary. */
  boundaryX: number;
}
