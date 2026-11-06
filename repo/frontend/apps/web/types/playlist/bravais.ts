import type { QueueInstance } from "@/types/playlist/lattice";

/** The two halves of the wall, either side of the song list. */
export type BravaisSide = "left" | "right";

/**
 * The wall in screen pixels: its halves are `columns` blocks wide and fill the space beside the list
 * exactly, so no tile is ever cut by the list or the pane's edge.
 */
export interface BravaisWall {
  trackCount: number;
  /** Blocks across one halve. */
  columns: number;
  sideWidth: number;
  /** Size of one template unit, including its gap. */
  unit: number;
  blockSize: number;
  blockRows: number;
  /** Height after which the wall repeats. */
  cellHeight: number;
  cellSlots: number;
}

/** One poster; its x and y are relative to its own halve, which scrolls against the other one. */
export interface BravaisSeat {
  instance: QueueInstance;
  side: BravaisSide;
}
