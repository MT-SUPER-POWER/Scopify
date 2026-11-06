export interface GridMetrics {
  cardWidth: number;
  cardHeight: number;
  /** Horizontal distance between two cards of one row; odd rows are shifted by half of it. */
  spacingX: number;
  spacingY: number;
  /** Distance from the pane centre (in world pixels) at which a card has fully shrunk and faded. */
  maxDistance: number;
}

/** One seat on the endless hex wall; a song owns many seats because the wall repeats the playlist. */
export interface GridCell {
  key: string;
  col: number;
  row: number;
  x: number;
  y: number;
  /** Index into the page's tracks. */
  index: number;
}

export interface GridCardFrame {
  visible: boolean;
  scale: number;
  opacity: number;
  /** 0 at the pane centre, 1 at `maxDistance` and beyond. */
  progress: number;
  zIndex: number;
  /** Close enough to the pane centre to count as the focused card. */
  centered: boolean;
}

export type GridDirection = "up" | "down" | "left" | "right";
