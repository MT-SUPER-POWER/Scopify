export interface DesktopPlaybackWallpaperControlSenderIds {
  controllerWindowId?: number | null;
  mainWindowId?: number | null;
  trayWindowId?: number | null;
}

export interface DesktopPlaybackWallpaperModelReaderIds extends DesktopPlaybackWallpaperControlSenderIds {
  wallpaperWindowId?: number | null;
}

export function isDesktopPlaybackWallpaperControlSender(
  senderId: number,
  allowed: DesktopPlaybackWallpaperControlSenderIds,
) {
  return [allowed.mainWindowId, allowed.trayWindowId, allowed.controllerWindowId].some(
    (windowId) => windowId !== null && windowId !== undefined && windowId === senderId,
  );
}

export function isDesktopPlaybackWallpaperModelReader(
  senderId: number,
  allowed: DesktopPlaybackWallpaperModelReaderIds,
) {
  return (
    isDesktopPlaybackWallpaperControlSender(senderId, allowed) ||
    allowed.wallpaperWindowId === senderId
  );
}

export function isDesktopPlaybackWallpaperPublisherSender(
  senderId: number,
  mainWindowId?: number | null,
) {
  return mainWindowId !== null && mainWindowId !== undefined && senderId === mainWindowId;
}
