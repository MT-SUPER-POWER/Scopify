import type { BlockSlot } from "@/types/playlist/lattice";

/** Space between tiles, and between the halves and whatever they meet. */
export const BRAVAIS_GAP = 6;

export const BRAVAIS_PANEL_MIN_WIDTH = 320;
export const BRAVAIS_PANEL_MAX_WIDTH = 420;
export const BRAVAIS_PANEL_ROW_HEIGHT = 56;

/** A halve is this many blocks wide unless the user zooms; picked so tiles stay poster-sized. */
export const BRAVAIS_COLUMN_TARGET_WIDTH = 560;
export const BRAVAIS_MAX_COLUMNS = 4;
/** Below this, a halve is too thin to be worth drawing and the list takes the pane. */
export const BRAVAIS_MIN_SIDE_WIDTH = 100;
/** Narrowest block zooming out may reach. */
export const BRAVAIS_MIN_BLOCK_SIZE = 150;

export const BRAVAIS_BLOCK_UNITS = 6;
export const BRAVAIS_SLOTS_PER_BLOCK = 6;

const small = (x: number, y: number): BlockSlot => ({ x, y, cols: 2, rows: 2 });
const big = (x: number, y: number): BlockSlot => ({ x, y, cols: 4, rows: 4 });

/**
 * Each block is one big poster and five small ones, in the corner the template puts it. Every tile is
 * square, so album art is never cropped, which is the wall's character next to Lattice's cut-outs.
 */
export const BRAVAIS_TEMPLATES: BlockSlot[][] = [
  [big(0, 0), small(4, 0), small(4, 2), small(0, 4), small(2, 4), small(4, 4)],
  [small(0, 0), big(2, 0), small(0, 2), small(0, 4), small(2, 4), small(4, 4)],
  [small(0, 0), small(2, 0), small(4, 0), big(0, 2), small(4, 2), small(4, 4)],
  [small(0, 0), small(2, 0), small(4, 0), small(0, 2), big(2, 2), small(0, 4)],
];
