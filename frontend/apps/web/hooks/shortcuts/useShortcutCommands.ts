"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  usePlaybackPosition as usePlaybackPositionMs,
  usePlaybackProjection,
} from "@/hooks/player/usePlaybackProjection";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { useUiStore } from "@/store/module/ui";
import type { ShortcutCommandId } from "@/types/shortcuts";

const VOLUME_STEP = 5;
let muteRestoreLevel: number | null = null;

export function useShortcutCommands() {
  const router = useRouter();
  const playback = usePlaybackProjection();
  const positionMs = usePlaybackPositionMs();
  const commands = usePlaybackCommands();
  const playbackRef = useRef(playback);
  const positionMsRef = useRef(positionMs);
  playbackRef.current = playback;
  positionMsRef.current = positionMs;

  return useCallback(
    (commandId: ShortcutCommandId) => {
      const ui = useUiStore.getState();
      const { durationMs, volume } = playbackRef.current;
      const seekBy = (deltaMs: number) => {
        const unclampedPositionMs = Math.max(0, positionMsRef.current + deltaMs);
        const targetPositionMs =
          durationMs > 0 ? Math.min(durationMs, unclampedPositionMs) : unclampedPositionMs;
        void commands.seek(targetPositionMs);
      };

      switch (commandId) {
        case "toggle-playback":
          void commands.toggle();
          return;
        case "previous-track":
          void commands.previous();
          return;
        case "next-track":
          void commands.next();
          return;
        case "increase-volume":
          void commands.setVolume(Math.min(100, volume + VOLUME_STEP));
          return;
        case "decrease-volume":
          void commands.setVolume(Math.max(0, volume - VOLUME_STEP));
          return;
        case "toggle-mute":
          if (volume > 0) {
            muteRestoreLevel = volume;
            void commands.setVolume(0);
          } else if (muteRestoreLevel !== null) {
            void commands.setVolume(muteRestoreLevel);
          }
          return;
        case "seek-backward-5s":
          seekBy(-5_000);
          return;
        case "seek-forward-5s":
          seekBy(5_000);
          return;
        case "seek-backward-1s":
          seekBy(-1_000);
          return;
        case "seek-forward-1s":
          seekBy(1_000);
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
          router.push("/setting?tab=shortcuts", { scroll: false });
          return;
        case "show-shortcut-help":
          ui.setIsShortcutHelpOpen(!ui.isShortcutHelpOpen);
          return;
        case "open-command-palette":
          ui.setIsCommandPaletteOpen(true);
      }
    },
    [commands, router],
  );
}
