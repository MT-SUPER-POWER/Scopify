import { runtime } from "@/lib/runtime";

/**
 * Narrow, side-effect-free seam for the future dedicated Playback Host bridge.
 * It intentionally exposes no playback transport before the main-process host
 * lifecycle is ready, preventing this route from becoming a second Authority.
 */
export function getPlaybackHostDesktopAdapter() {
  if (!runtime.isDesktop || runtime.kind !== "desktop") return null;

  return { kind: runtime.kind } as const;
}
