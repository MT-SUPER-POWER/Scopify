import type { Rectangle } from "electron";
// Target-display resolution for Windows wallpaper mode, adapted from Folia's
// electron/windowsWallpaperTarget.cjs (7452afd2). The wallpaper follows the main window - the
// display the app window was on when wallpaper mode was entered - instead of always going to
// the primary display. The helper is not told about the monitor: it fills whichever display the
// window sits on before it is re-parented, so placing the window is the whole contract here.
//
// Resolution order:
//   1. the display the running wallpaper session already covers (a reconcile while attached
//      must not jump screens because the window now *is* that display's geometry)
//   2. the display under the ordinary main window's bounds
//   3. the primary display (no usable bounds, or the remembered display was unplugged)

export interface WallpaperTargetDisplay {
  bounds: Rectangle;
  id: number;
}

export interface WallpaperTargetScreen<Display extends WallpaperTargetDisplay> {
  getAllDisplays(): Display[];
  getDisplayMatching(rect: Rectangle): Display;
  getPrimaryDisplay(): Display;
}

export interface ResolveWallpaperTargetDisplayOptions<Display extends WallpaperTargetDisplay> {
  screen: WallpaperTargetScreen<Display>;
  /** Display id of the wallpaper session that is currently attached, if any. */
  sessionDisplayId?: string | null;
  /** Bounds of the main window as an ordinary window (live, or as captured before attach). */
  windowBounds?: Rectangle | null;
}
