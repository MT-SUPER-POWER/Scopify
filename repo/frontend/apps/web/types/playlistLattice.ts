import type { RefObject } from "react";

export type BlockSlot = { x: number; y: number; cols: number; rows: number };

export interface LatticeCamera {
  x: number;
  y: number;
  scale: number;
}
export interface LatticeViewport {
  width: number;
  height: number;
}
export interface LatticeDrag {
  pointerId: number;
  x: number;
  y: number;
  camera: LatticeCamera;
  lastX: number;
  lastY: number;
  time: number;
  vx: number;
  vy: number;
}

export type TileSpan = { cols: number; rows: number };

export type WallMetrics = { cellSize: number; gap: number };

export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type ReflowTile = {
  instanceId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * One drawn poster. The queue is de-duplicated at the data layer, but the wall repeats, so a
 * song owns many instances: `cellSlot` is its seat inside one lattice cell and `repeatX/Y`
 * says which copy of the cell this is.
 */
export type QueueInstance = {
  instanceId: string;
  queueIndex: number;
  cellSlot: number;
  repeatX: number;
  repeatY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** The repeating unit: a rectangle of blocks holding one pass over the queue. */
export type LatticeGeometry = {
  blocksPerRow: number;
  blockRows: number;
  cellSlots: number;
  cellWidth: number;
  cellHeight: number;
  blockWidth: number;
  blockHeight: number;
};

export interface LatticePointerOptions {
  fieldRef: RefObject<HTMLDivElement | null>;
  cameraRef: RefObject<LatticeCamera>;
  viewportRef: RefObject<LatticeViewport>;
  animationRef: RefObject<{ stop: () => void } | null>;
  apply: (camera: LatticeCamera, force?: boolean) => void;
  stop: () => void;
  reducedMotion: boolean | null;
}

export type WallDirection = "up" | "down" | "left" | "right";

export type Axis = {
  along: "x" | "y";
  cross: "y" | "x";
  alongSize: "width" | "height";
  crossSize: "height" | "width";
  sign: 1 | -1;
};
