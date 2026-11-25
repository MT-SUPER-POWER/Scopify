import type { CanvasPoint, CanvasRect, CanvasSpacing } from "@/types/scratchpad/canvas";
import type { ScratchpadCardDensity } from "@/types/scratchpad/model";

export const STANDARD_SPACING: CanvasSpacing = {
  x: 16,
  y: 18,
  edge: 20,
  card: { width: 172, height: 226 },
};

export const COMPACT_SPACING: CanvasSpacing = {
  x: 12,
  y: 14,
  edge: 20,
  card: { width: 144, height: 192 },
};

export const OVERVIEW_CARD_SPACING: CanvasSpacing = {
  x: 14,
  y: 14,
  edge: 0,
  card: { width: 152, height: 202 },
};

export function spacingForDensity(density: ScratchpadCardDensity): CanvasSpacing {
  return density === "compact" ? COMPACT_SPACING : STANDARD_SPACING;
}

export function columnsFor(width: number, spacing: CanvasSpacing = STANDARD_SPACING): number {
  return Math.max(1, Math.floor((width + spacing.x) / (spacing.card.width + spacing.x)));
}

export function slotPosition(
  index: number,
  columns: number,
  spacing: CanvasSpacing = STANDARD_SPACING,
): CanvasPoint {
  return {
    x: (index % columns) * (spacing.card.width + spacing.x),
    y: Math.floor(index / columns) * (spacing.card.height + spacing.y),
  };
}

export function gridHeight(
  count: number,
  columns: number,
  spacing: CanvasSpacing = STANDARD_SPACING,
): number {
  if (count <= 0) return 0;
  const rows = Math.ceil(count / columns);
  return rows * spacing.card.height + (rows - 1) * spacing.y;
}

export function dropIndexAt(
  topLeft: CanvasPoint,
  columns: number,
  slotCount: number,
  spacing: CanvasSpacing = STANDARD_SPACING,
): number {
  const column = Math.min(
    columns - 1,
    Math.max(0, Math.round(topLeft.x / (spacing.card.width + spacing.x))),
  );
  const row = Math.max(0, Math.round(topLeft.y / (spacing.card.height + spacing.y)));
  return Math.min(slotCount, Math.max(0, row * columns + column));
}

export function previewSlots(
  keys: readonly string[],
  moving: ReadonlySet<string>,
  dropIndex: number,
): Map<string, number> {
  const slots = new Map<string, number>();
  let index = 0;
  for (const key of keys) {
    if (moving.has(key)) continue;
    if (index === dropIndex) index += moving.size;
    slots.set(key, index);
    index += 1;
  }
  return slots;
}

export function rectFromPoints(a: CanvasPoint, b: CanvasPoint): CanvasRect {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

export function rectsIntersect(a: CanvasRect, b: CanvasRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

export function cardRect(
  origin: CanvasPoint,
  index: number,
  columns: number,
  spacing: CanvasSpacing = STANDARD_SPACING,
): CanvasRect {
  const { x, y } = slotPosition(index, columns, spacing);
  return {
    left: origin.x + x,
    top: origin.y + y,
    right: origin.x + x + spacing.card.width,
    bottom: origin.y + y + spacing.card.height,
  };
}
