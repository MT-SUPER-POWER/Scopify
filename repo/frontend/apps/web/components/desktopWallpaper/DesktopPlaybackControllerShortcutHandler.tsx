"use client";

import { useDesktopPlaybackControllerShortcuts } from "@/hooks/desktopWallpaper/useDesktopPlaybackControllerShortcuts";
import type { DesktopPlaybackControllerShortcutHandlerProps } from "@/types/desktop/playbackWallpaper";

export function DesktopPlaybackControllerShortcutHandler({
  onClose,
}: DesktopPlaybackControllerShortcutHandlerProps) {
  useDesktopPlaybackControllerShortcuts({ onClose });
  return null;
}
