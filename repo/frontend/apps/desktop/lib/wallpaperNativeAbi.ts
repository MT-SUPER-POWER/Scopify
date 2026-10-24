/** Required exports of the single Rust desktop module, checked during build and lazy loading. */
export const WALLPAPER_NATIVE_EXPORTS = [
  "attach",
  "detach",
  "pollEvents",
  "isAttached",
  "getDesktopIconVisibility",
  "setDesktopIconVisibility",
  "applySystemWallpaper",
  "restoreSystemWallpaper",
  "restoreSystemWallpaperSync",
] as const;
