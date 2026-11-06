import type { WallMetrics } from "@/types/playlist/lattice";

/** Pixel size of one wall unit; a block is 12 x 8 units and the camera starts at scale 1. */
export const BRAVAIS_METRICS: WallMetrics = { cellSize: 64, gap: 6 };

export const BRAVAIS_SEAM_MIN_WIDTH = 300;
export const BRAVAIS_SEAM_MAX_WIDTH = 400;
export const BRAVAIS_SEAM_ROW_HEIGHT = 50;
