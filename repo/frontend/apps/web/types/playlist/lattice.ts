import type { RefObject } from "react";

export type BlockSlot = { x: number; y: number; cols: number; rows: number };

export interface LatticeCamera {
  x: number;
  y: number;
  scale: number;
}
export interface LatticeCameraOptions {
  /** Starts at scale 1 with the world origin in the middle of the pane, and centres without the header inset. */
  centered?: boolean;
  /** Scale limits for zooming; defaults to 0.2 - 2. */
  minScale?: number;
  maxScale?: number;
  /** Called with every camera the wall applies, including drag and inertia frames. */
  onFrame?: (camera: LatticeCamera) => void;
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
  /** Ctrl/Cmd + wheel (and trackpad pinch) zoom about the pointer. */
  zoom: (factor: number, clientX: number, clientY: number) => void;
}

export type WallDirection = "up" | "down" | "left" | "right";

export type Axis = {
  along: "x" | "y";
  cross: "y" | "x";
  alongSize: "width" | "height";
  crossSize: "height" | "width";
  sign: 1 | -1;
};
/** Immersive alternatives to the track table; each one takes over the whole content pane. */
export type PlaylistViewMode = "lattice" | "grid";

export interface LatticePreferences {
  followCurrent: boolean;
  lightsOff: boolean;
  /** The immersive view the header button and shortcuts open. */
  viewMode: PlaylistViewMode;
  /** Whether the page was last left in an immersive view; the next page then opens straight into it. */
  immersive: boolean;
  setFollowCurrent: (value: boolean) => void;
  setLightsOff: (value: boolean) => void;
  setViewMode: (value: PlaylistViewMode) => void;
  setImmersive: (value: boolean) => void;
}

/** Opens or closes the immersive view of the playlist page that is currently mounted. */
export interface LatticeViewController {
  /** Without a mode, opens the remembered one. Switching modes while open is allowed. */
  open: (mode?: PlaylistViewMode) => void;
  close: () => void;
}

export interface LatticeViewState {
  active: boolean;
  controller: LatticeViewController | null;
  setActive: (active: boolean) => void;
  register: (controller: LatticeViewController) => () => void;
}
