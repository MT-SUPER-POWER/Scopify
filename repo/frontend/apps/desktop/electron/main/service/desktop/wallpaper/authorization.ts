import type {
  DesktopPlaybackWallpaperControlSenderIds,
  DesktopPlaybackWallpaperModelReaderIds,
} from "@/types/service/desktop/wallpaper/authorization";
export type {
  DesktopPlaybackWallpaperControlSenderIds,
  DesktopPlaybackWallpaperModelReaderIds,
} from "@/types/service/desktop/wallpaper/authorization";

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
  return isDesktopPlaybackWallpaperControlSender(senderId, allowed);
}
