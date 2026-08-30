"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH,
  FOLIA_THEME_LIBRARY_OPEN_EVENT,
  FOLIA_THEME_LIBRARY_PENDING_KEY,
} from "@/constants/desktopPlaybackController";
import { runtime } from "@/lib/runtime";
import { useUiStore } from "@/store/module/ui";

export function DesktopPlaybackControllerCommandHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!runtime.isDesktop) return;

    return runtime.navigation.onNavigate((path) => {
      if (path !== DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH) return;
      try {
        window.sessionStorage.setItem(FOLIA_THEME_LIBRARY_PENDING_KEY, "1");
      } catch {
        // The event below still opens an already-mounted stage when storage is unavailable.
      }
      useUiStore.getState().setIsLyricsOpen(true);
      router.push(path);
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event(FOLIA_THEME_LIBRARY_OPEN_EVENT));
      });
    });
  }, [router]);

  return null;
}
