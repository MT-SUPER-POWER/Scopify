const COMPANION_PLAYBACK_PATHS = new Set([
  "/desktop-lyrics",
  "/desktop-playback-controller",
  "/desktop-wallpaper",
  "/tray",
]);

/** Normalizes Next's regular and trailing-slash static-export route shapes. */
export function getCompanionPlaybackPath(pathname: string): string | null {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return COMPANION_PLAYBACK_PATHS.has(normalizedPathname) ? normalizedPathname : null;
}
