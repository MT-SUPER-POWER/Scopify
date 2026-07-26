"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { saveScrollPositionBeforeNavigation } from "@/lib/hooks/useScrollRestoration";
import { usePlayerStore } from "@/store";
import { useUiStore } from "@/store/module/ui";
import type { ShortcutCommandId } from "@/types/shortcuts";

const VOLUME_STEP = 5;
let muteRestoreLevel: number | null = null;

export function useShortcutCommands() {
  const router = useRouter();

  return useCallback(
    (commandId: ShortcutCommandId) => {
      const player = usePlayerStore.getState();
      const ui = useUiStore.getState();

      switch (commandId) {
        case "toggle-playback":
          player.togglePlaying();
          return;
        case "previous-track":
          void player.playPrev();
          return;
        case "next-track":
          void player.playNext();
          return;
        case "increase-volume":
          player.setVolume(Math.min(100, player.volume + VOLUME_STEP));
          return;
        case "decrease-volume":
          player.setVolume(Math.max(0, player.volume - VOLUME_STEP));
          return;
        case "toggle-mute":
          if (player.volume > 0) {
            muteRestoreLevel = player.volume;
            player.setVolume(0);
          } else if (muteRestoreLevel !== null) {
            player.setVolume(muteRestoreLevel);
          }
          return;
        case "open-search":
          ui.setIsSearchOpen(!ui.isSearchOpen);
          return;
        case "toggle-lyric-stage":
          ui.toggleLyrics();
          return;
        case "toggle-sidebar":
          ui.toggleSidebar();
          return;
        case "toggle-queue":
          ui.toggleQueue();
          return;
        case "toggle-fullscreen":
          void toggleApplicationFullscreen();
          return;
        case "open-shortcut-settings":
          saveScrollPositionBeforeNavigation();
          router.push("/setting?tab=shortcuts", { scroll: false });
          return;
        case "show-shortcut-help":
          ui.setIsShortcutHelpOpen(!ui.isShortcutHelpOpen);
          return;
        case "open-command-palette":
          ui.setIsCommandPaletteOpen(true);
      }
    },
    [router],
  );
}
