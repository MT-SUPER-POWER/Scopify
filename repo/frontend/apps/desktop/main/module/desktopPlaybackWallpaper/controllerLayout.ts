import type { Rectangle } from "electron";

import type { DesktopPlaybackControllerLayout } from "@mt-super-power/desktop-contract";

export const DESKTOP_PLAYBACK_CONTROLLER_SIZES = {
  compact: { height: 230, width: 450 },
  expanded: { height: 640, width: 450 },
} as const satisfies Record<DesktopPlaybackControllerLayout, Pick<Rectangle, "height" | "width">>;

export function resolveDesktopPlaybackControllerBounds(
  layout: DesktopPlaybackControllerLayout,
  currentBounds: Rectangle,
  workArea: Rectangle,
): Rectangle {
  const requestedSize = DESKTOP_PLAYBACK_CONTROLLER_SIZES[layout];
  const width = Math.min(requestedSize.width, workArea.width);
  const height = Math.min(requestedSize.height, workArea.height);
  const maximumX = workArea.x + workArea.width - width;
  const maximumY = workArea.y + workArea.height - height;

  return {
    height,
    width,
    x: clamp(currentBounds.x, workArea.x, maximumX),
    y: clamp(currentBounds.y, workArea.y, maximumY),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
