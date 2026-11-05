import type { QueueInstance } from "@/types/playlist/lattice";

/** One seat on the finite wall; seats past the last song stay empty so the final block keeps its shape. */
export interface BravaisSeat {
  instance: QueueInstance;
  /** Index into the page's tracks, or -1 for an empty seat. */
  trackIndex: number;
  /** Which side of the seam the seat belongs to. */
  side: "left" | "right";
}

export interface BravaisWall {
  seats: BravaisSeat[];
  /** Block column whose left edge the seam opens on. */
  anchorColumn: number;
  blocksPerRow: number;
  blockWidth: number;
  /** World x of the gap midline the seam opens on; it is always a block boundary. */
  boundaryX: number;
  width: number;
  height: number;
}
