export type QueryDevtoolsCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface QueryDevtoolsActivePointer {
  hasDragged: boolean;
  pointerId: number;
  startX: number;
  startY: number;
}
