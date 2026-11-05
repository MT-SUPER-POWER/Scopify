export interface GridMetrics {
  cardWidth: number;
  cardHeight: number;
  /** Horizontal distance between two cards of one row; odd rows are shifted by half of it. */
  spacingX: number;
  spacingY: number;
  /** Distance from the pane centre at which a card has fully shrunk and faded. */
  maxDistance: number;
}

/** Where one track's card sits on the hex wall, relative to the first track at the origin. */
export interface GridCell {
  index: number;
  x: number;
  y: number;
}

export interface GridCardFrame {
  visible: boolean;
  scale: number;
  opacity: number;
  zIndex: number;
  /** Close enough to the pane centre to count as the focused card. */
  centered: boolean;
}

export type GridDirection = "up" | "down" | "left" | "right";
