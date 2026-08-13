const COMPANION_PLAYBACK_PATHS = new Set([
  "/desktop-lyrics",
  "/desktop-playback-controller",
  "/desktop-wallpaper",
  "/tray",
]);
const DEDICATED_PLAYBACK_HOST_PATH = "/playback-host";

/** Normalizes Next's regular and trailing-slash static-export route shapes. */
export function getCompanionPlaybackPath(pathname: string): string | null {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  // The hidden Host is the future Authority owner, never a dashboard Companion
  // Replica. Keep this explicit instead of relying on omission from the set.
  if (normalizedPathname === DEDICATED_PLAYBACK_HOST_PATH) return null;
  return COMPANION_PLAYBACK_PATHS.has(normalizedPathname) ? normalizedPathname : null;
}
