"use client";

import { useEffect } from "react";
import {
  DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH,
  DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH,
} from "@/constants/desktopPlaybackController";
import { runtime } from "@/lib/runtime";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";

export function DesktopPlaybackControllerCommandHandler() {
  useEffect(() => {
    if (!runtime.isDesktop) return;
    const openSettings = (path: string) => {
      const settings = useFoliaSettingsStore.getState();
      if (path === DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH) settings.openThemeLibrary();
      if (path === DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH)
        settings.openVisualSettings();
    };
    openSettings(`${window.location.pathname}${window.location.search}`);
    return runtime.navigation.onNavigate(openSettings);
  }, []);
  return null;
}
