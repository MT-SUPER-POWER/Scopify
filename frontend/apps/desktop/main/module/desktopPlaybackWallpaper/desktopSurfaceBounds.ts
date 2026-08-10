import type { Rectangle } from "electron";

export interface DesktopSurfaceBoundsResult {
  ActualBottom: number;
  ActualClientBottom: number;
  ActualClientLeft: number;
  ActualClientRight: number;
  ActualClientTop: number;
  ActualLeft: number;
  ActualRight: number;
  ActualTop: number;
  CoversRequestedBounds: boolean;
  CoversRequestedClientBounds: boolean;
  RequestedBottom: number;
  RequestedLeft: number;
  RequestedRight: number;
  RequestedTop: number;
}

export function desktopSurfaceHostCoversExactBounds(
  host: DesktopSurfaceBoundsResult,
  targetBounds: Rectangle,
) {
  const right = targetBounds.x + targetBounds.width;
  const bottom = targetBounds.y + targetBounds.height;
  return (
    host.CoversRequestedBounds &&
    host.CoversRequestedClientBounds &&
    host.RequestedLeft === targetBounds.x &&
    host.RequestedTop === targetBounds.y &&
    host.RequestedRight === right &&
    host.RequestedBottom === bottom &&
    host.ActualLeft === targetBounds.x &&
    host.ActualTop === targetBounds.y &&
    host.ActualRight === right &&
    host.ActualBottom === bottom &&
    host.ActualClientLeft === targetBounds.x &&
    host.ActualClientTop === targetBounds.y &&
    host.ActualClientRight === right &&
    host.ActualClientBottom === bottom
  );
}
