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
