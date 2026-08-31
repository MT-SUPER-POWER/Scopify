import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";

const WALLPAPER_PRESENTATION_STATES = new Set([
  "policy-paused",
  "recovering",
  "running",
  "starting",
]);

/** Keeps the main Renderer in its Stage-only shape only while a wallpaper host can own it. */
export function shouldRenderDesktopPlaybackWallpaper(model: DesktopPlaybackWallpaperModel | null) {
  if (!model?.preferences.enabled) return false;
  if (!model.preferences.layers.background && !model.preferences.layers.lyrics) return false;
  return WALLPAPER_PRESENTATION_STATES.has(model.status.state);
}
