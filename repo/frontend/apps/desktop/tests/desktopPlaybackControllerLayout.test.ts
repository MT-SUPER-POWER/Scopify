import { describe, expect, test } from "bun:test";

import {
  DESKTOP_PLAYBACK_CONTROLLER_SIZES,
  resolveDesktopPlaybackControllerBounds,
} from "../main/module/desktopPlaybackWallpaper/controllerLayout";

describe("desktop playback controller layout", () => {
  test("keeps the compact card anchored when it already fits the work area", () => {
    expect(
      resolveDesktopPlaybackControllerBounds(
        "compact",
        { height: 640, width: 450, x: 120, y: 80 },
        { height: 1040, width: 1920, x: 0, y: 0 },
      ),
    ).toEqual({
      ...DESKTOP_PLAYBACK_CONTROLLER_SIZES.compact,
      x: 120,
      y: 80,
    });
  });

  test("clamps the expanded panel inside the active display work area", () => {
    expect(
      resolveDesktopPlaybackControllerBounds(
        "expanded",
        { height: 230, width: 450, x: 1700, y: 800 },
        { height: 1040, width: 1920, x: 0, y: 0 },
      ),
    ).toEqual({
      ...DESKTOP_PLAYBACK_CONTROLLER_SIZES.expanded,
      x: 1470,
      y: 400,
    });
  });

  test("shrinks safely when the work area is smaller than the requested layout", () => {
    expect(
      resolveDesktopPlaybackControllerBounds(
        "expanded",
        { height: 230, width: 450, x: -500, y: -500 },
        { height: 480, width: 360, x: -360, y: 40 },
      ),
    ).toEqual({ height: 480, width: 360, x: -360, y: 40 });
  });
});
