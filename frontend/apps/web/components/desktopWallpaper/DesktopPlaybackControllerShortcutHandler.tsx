"use client";

import { useDesktopPlaybackControllerShortcuts } from "@/hooks/desktopWallpaper/useDesktopPlaybackControllerShortcuts";

interface DesktopPlaybackControllerShortcutHandlerProps {
  onClose(): void;
}

export function DesktopPlaybackControllerShortcutHandler({
  onClose,
}: DesktopPlaybackControllerShortcutHandlerProps) {
  useDesktopPlaybackControllerShortcuts(onClose);
  return null;
}
