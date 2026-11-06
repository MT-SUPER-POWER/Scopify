import type { WallMetrics } from "@/types/playlist/lattice";

/** Pixel size of one wall unit; a block is 12 x 8 units and the camera starts at scale 1. */
export const BRAVAIS_METRICS: WallMetrics = { cellSize: 84, gap: 6 };

export const BRAVAIS_PANEL_MIN_WIDTH = 320;
export const BRAVAIS_PANEL_MAX_WIDTH = 420;
/** Clear space a revealed tile keeps from the panel. */
export const BRAVAIS_PANEL_INSET = 12;
export const BRAVAIS_PANEL_ROW_HEIGHT = 56;
