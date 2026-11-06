import type { LatticeGeometry } from "@/types/playlist/lattice";

export interface BravaisWall {
  geometry: LatticeGeometry;
  trackCount: number;
  /** World x the camera starts on, a block boundary. */
  originX: number;
}
