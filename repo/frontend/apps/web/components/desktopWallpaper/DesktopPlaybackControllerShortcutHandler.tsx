"use client";

import { useDesktopPlaybackControllerShortcuts } from "@/hooks/desktopWallpaper/useDesktopPlaybackControllerShortcuts";
import type { DesktopPlaybackControllerShortcutHandlerProps } from "@/types/desktopPlaybackWallpaper";

export function DesktopPlaybackControllerShortcutHandler({
  onClose,
}: DesktopPlaybackControllerShortcutHandlerProps) {
  useDesktopPlaybackControllerShortcuts({ onClose });
  return null;
}
