"use client";

import { useEffect } from "react";

import { DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS } from "@/constants/shortcuts";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { runtime } from "@/lib/runtime";

export function useDesktopPlaybackControllerShortcuts(onClose: () => void) {
  const executeCommand = useShortcutCommands({
    navigateTo: runtime.navigation.navigateMainWindow,
  });

  useInWindowShortcuts({
    commandIds: DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS,
    executeCommand,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.code !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}
