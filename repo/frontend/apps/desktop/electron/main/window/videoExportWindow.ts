import type { Rectangle } from "electron";

const EXPORT_CAPTURE_MARGIN_PHYSICAL_PX = 6;

function alignToPhysicalPixel(value: number, scaleFactor: number): number {
  const rounded = Math.round(value);
  for (let distance = 0; distance <= 8; distance += 1) {
    for (const candidate of [rounded - distance, rounded + distance]) {
      if (Math.abs(candidate * scaleFactor - Math.round(candidate * scaleFactor)) < 0.001) {
        return candidate;
      }
    }
  }
  return rounded;
}

export function resolveVideoExportWindowBounds({
  currentBounds,
  workArea,
  scaleFactor,
  target,
}: {
  currentBounds: Rectangle;
  workArea: Rectangle;
  scaleFactor: number;
  target: { width: number; height: number };
}): Rectangle {
  const safeScaleFactor = Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1;
  const marginCssPx = Math.ceil(EXPORT_CAPTURE_MARGIN_PHYSICAL_PX / safeScaleFactor);
  const width = Math.ceil(target.width / safeScaleFactor) + marginCssPx;
  const height = Math.ceil(target.height / safeScaleFactor) + marginCssPx;
  const centeredX = currentBounds.x + (currentBounds.width - width) / 2;
  const centeredY = currentBounds.y + (currentBounds.height - height) / 2;
  const maxX = workArea.x + Math.max(0, workArea.width - width);
  const maxY = workArea.y + Math.max(0, workArea.height - height);
  const x = alignToPhysicalPixel(Math.min(maxX, Math.max(workArea.x, centeredX)), safeScaleFactor);
  const y = alignToPhysicalPixel(Math.min(maxY, Math.max(workArea.y, centeredY)), safeScaleFactor);

  return {
    x: Math.min(maxX, Math.max(workArea.x, x)),
    y: Math.min(maxY, Math.max(workArea.y, y)),
    width,
    height,
  };
}
