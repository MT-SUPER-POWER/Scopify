import type {
  WallpaperTargetDisplay,
  ResolveWallpaperTargetDisplayOptions,
} from "@/types/service/desktop/wallpaper/wallpaperTargetDisplay";
export type {
  WallpaperTargetDisplay,
  WallpaperTargetScreen,
  ResolveWallpaperTargetDisplayOptions,
} from "@/types/service/desktop/wallpaper/wallpaperTargetDisplay";
import type { Rectangle } from "electron";

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
