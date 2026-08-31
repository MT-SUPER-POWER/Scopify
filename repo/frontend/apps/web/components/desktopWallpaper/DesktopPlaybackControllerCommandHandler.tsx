"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH,
  DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH,
  FOLIA_THEME_LIBRARY_OPEN_EVENT,
  FOLIA_THEME_LIBRARY_PENDING_KEY,
  FOLIA_VISUAL_SETTINGS_OPEN_EVENT,
  FOLIA_VISUAL_SETTINGS_PENDING_KEY,
} from "@/constants/desktopPlaybackController";
import { runtime } from "@/lib/runtime";
import { useUiStore } from "@/store/module/ui";

export function DesktopPlaybackControllerCommandHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!runtime.isDesktop) return;

    return runtime.navigation.onNavigate((path) => {
      const foliaRequest =
        path === DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH
          ? {
              eventName: FOLIA_THEME_LIBRARY_OPEN_EVENT,
              pendingKey: FOLIA_THEME_LIBRARY_PENDING_KEY,
            }
          : path === DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH
            ? {
                eventName: FOLIA_VISUAL_SETTINGS_OPEN_EVENT,
                pendingKey: FOLIA_VISUAL_SETTINGS_PENDING_KEY,
              }
            : null;
      if (!foliaRequest) return;
      try {
        window.sessionStorage.setItem(foliaRequest.pendingKey, "1");
      } catch {
        // The event below still opens an already-mounted stage when storage is unavailable.
      }
      useUiStore.getState().setIsLyricsOpen(true);
      router.push(path);
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event(foliaRequest.eventName));
      });
    });
  }, [router]);

  return null;
}
