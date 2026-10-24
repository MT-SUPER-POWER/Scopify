const DESKTOP_AUXILIARY_PATHS = new Set([
  "/app-close",
  "/desktop-lyrics",
  "/desktop-playback-controller",
  "/dynamic-island",
  "/login",
  "/taskbar-lyric",
  "/tray",
]);

export function isDesktopAuxiliaryRoute(pathname: string) {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return DESKTOP_AUXILIARY_PATHS.has(normalizedPathname);
}
