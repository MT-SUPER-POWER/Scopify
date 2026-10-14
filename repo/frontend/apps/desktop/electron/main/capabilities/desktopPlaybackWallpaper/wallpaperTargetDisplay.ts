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

// Electron reports -1 for a display whose id is not known yet and -10 for a virtual display on
// a unified desktop; neither can be matched against a later display list.
export const isUsableDisplayId = (id: number) => Number.isInteger(id) && id > 0;

const hasArea = (bounds: Rectangle | null | undefined): bounds is Rectangle =>
  Boolean(bounds) &&
  Number.isFinite(bounds!.x) &&
  Number.isFinite(bounds!.y) &&
  Number.isFinite(bounds!.width) &&
  Number.isFinite(bounds!.height) &&
  bounds!.width > 0 &&
  bounds!.height > 0;

export const boundsIntersect = (a: Rectangle, b: Rectangle) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0 &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0;

// Screen lookups can throw or report nothing while the display topology is changing; the
// resolution degrades to "no display" instead of failing wallpaper entry.
const safely = <T>(lookup: () => T): T | null => {
  try {
    return lookup() ?? null;
  } catch {
    return null;
  }
};

export function resolveWallpaperTargetDisplay<Display extends WallpaperTargetDisplay>({
  screen,
  sessionDisplayId,
  windowBounds,
}: ResolveWallpaperTargetDisplayOptions<Display>): Display | null {
  const primary = () => safely(() => screen.getPrimaryDisplay());
  const displays = safely(() => screen.getAllDisplays()) ?? [];
  if (displays.length === 0) return primary();

  if (sessionDisplayId) {
    const remembered = displays.find(
      (display) => isUsableDisplayId(display.id) && String(display.id) === sessionDisplayId,
    );
    if (remembered) return remembered;
  }

  if (hasArea(windowBounds)) {
    const matched = safely(() => screen.getDisplayMatching(windowBounds));
    // getDisplayMatching answers "nearest" for a rect that intersects nothing (a minimized
    // window parked off-screen, a monitor that was unplugged); that guess is not followed.
    if (matched && hasArea(matched.bounds) && boundsIntersect(windowBounds, matched.bounds)) {
      return matched;
    }
  }
  return primary();
}
