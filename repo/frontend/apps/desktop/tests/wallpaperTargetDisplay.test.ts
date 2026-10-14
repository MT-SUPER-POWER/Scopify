import { describe, expect, test } from "bun:test";
import type { Rectangle } from "electron";
import {
  resolveWallpaperTargetDisplay,
  type WallpaperTargetDisplay,
} from "../electron/main/capabilities/desktopPlaybackWallpaper/wallpaperTargetDisplay";

// 壁纸目标显示器解析：跟随主窗口所在屏，会话中保持原屏，异常时回退主屏
const primary: WallpaperTargetDisplay = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
};
const secondary: WallpaperTargetDisplay = {
  id: 2,
  bounds: { x: 1920, y: -200, width: 2560, height: 1440 },
};

const overlap = (a: Rectangle, b: Rectangle) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

function screenOf(displays: WallpaperTargetDisplay[]) {
  return {
    getAllDisplays: () => displays,
    // Electron answers the nearest display even for a rect that touches none.
    getDisplayMatching: (rect: Rectangle) =>
      displays.reduce((best, display) =>
        overlap(rect, display.bounds) > overlap(rect, best.bounds) ? display : best,
      ),
    getPrimaryDisplay: () => displays[0],
  };
}

describe("resolveWallpaperTargetDisplay", () => {
  test("follows the display the main window is on", () => {
    const target = resolveWallpaperTargetDisplay({
      screen: screenOf([primary, secondary]),
      windowBounds: { x: 2400, y: 100, width: 1200, height: 800 },
    });
    expect(target?.id).toBe(2);
  });

  test("keeps the running session's display", () => {
    const target = resolveWallpaperTargetDisplay({
      screen: screenOf([primary, secondary]),
      sessionDisplayId: "2",
      windowBounds: { x: 100, y: 100, width: 800, height: 600 },
    });
    expect(target?.id).toBe(2);
  });

  test("falls back to the window when the session's display was unplugged", () => {
    const target = resolveWallpaperTargetDisplay({
      screen: screenOf([primary]),
      sessionDisplayId: "2",
      windowBounds: { x: 100, y: 100, width: 800, height: 600 },
    });
    expect(target?.id).toBe(1);
  });

  test("does not follow a nearest-display guess for bounds that touch no display", () => {
    const target = resolveWallpaperTargetDisplay({
      screen: screenOf([primary, secondary]),
      windowBounds: { x: -32000, y: -32000, width: 160, height: 28 },
    });
    expect(target?.id).toBe(1);
  });

  test("uses the primary display without usable bounds or when lookups throw", () => {
    expect(
      resolveWallpaperTargetDisplay({ screen: screenOf([primary, secondary]), windowBounds: null })
        ?.id,
    ).toBe(1);
    const throwing = {
      ...screenOf([primary, secondary]),
      getDisplayMatching: () => {
        throw new Error("topology changing");
      },
    };
    expect(
      resolveWallpaperTargetDisplay({
        screen: throwing,
        windowBounds: { x: 2400, y: 100, width: 1200, height: 800 },
      })?.id,
    ).toBe(1);
  });

  test("never matches a session by an unusable display id", () => {
    const virtualDisplay = { id: -10, bounds: secondary.bounds };
    const target = resolveWallpaperTargetDisplay({
      screen: screenOf([primary, virtualDisplay]),
      sessionDisplayId: "-10",
      windowBounds: { x: 100, y: 100, width: 800, height: 600 },
    });
    expect(target?.id).toBe(1);
  });
});
