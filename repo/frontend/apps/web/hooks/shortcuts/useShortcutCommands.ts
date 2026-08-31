"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  FOLIA_THEME_LIBRARY_PENDING_KEY,
  FOLIA_THEME_LIBRARY_TOGGLE_EVENT,
  FOLIA_VISUAL_SETTINGS_OPEN_EVENT,
  FOLIA_VISUAL_SETTINGS_PENDING_KEY,
} from "@/constants/desktopPlaybackController";
import {
  usePlaybackPosition as usePlaybackPositionMs,
  usePlaybackProjection,
} from "@/hooks/player/usePlaybackProjection";
import { toggleApplicationDeveloperTools } from "@/lib/shortcuts/developerTools";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { getCommentHref } from "@/lib/comment/commentResource";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";
import { usePlayerStore } from "@/store/module/player";
import { useUiStore } from "@/store/module/ui";
import { useSearchStore } from "@/store/module/search";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { runtime } from "@/lib/runtime";
import type { ShortcutCommandExecutorOptions, ShortcutCommandId } from "@/types/shortcuts";

const VOLUME_STEP = 5;
let muteRestoreLevel: number | null = null;

export function useShortcutCommands(options?: ShortcutCommandExecutorOptions) {
  const router = useRouter();
  const playback = usePlaybackProjection();
  const positionMs = usePlaybackPositionMs();
  const commands = usePlaybackCommands();
  const playbackRef = useRef(playback);
  const positionMsRef = useRef(positionMs);
  const navigateToOverride = options?.navigateTo;
  playbackRef.current = playback;
  positionMsRef.current = positionMs;

  const navigateTo = useCallback(
    (path: string) => {
      if (navigateToOverride) {
        navigateToOverride(path);
        return;
      }
      router.push(path, { scroll: false });
    },
    [navigateToOverride, router],
  );

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
      const toggleFoliaSurface = (pendingKey: string, eventName: string) => {
        try {
          window.sessionStorage.setItem(pendingKey, "1");
        } catch {
          // The event below still handles an already-mounted stage when storage is unavailable.
        }
        ui.setIsLyricsOpen(true);
        window.requestAnimationFrame(() => {
          window.dispatchEvent(new Event(eventName));
        });
      };

      switch (commandId) {
        case "toggle-playback":
          void commands.toggle();
          return;
        case "toggle-like":
          void commands.toggleLike();
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
        case "open-folia-settings":
          toggleFoliaSurface(FOLIA_VISUAL_SETTINGS_PENDING_KEY, FOLIA_VISUAL_SETTINGS_OPEN_EVENT);
          return;
        case "open-folia-theme-library":
          toggleFoliaSurface(FOLIA_THEME_LIBRARY_PENDING_KEY, FOLIA_THEME_LIBRARY_TOGGLE_EVENT);
          return;
        case "toggle-sidebar":
          ui.toggleSidebar();
          return;
        case "toggle-queue":
          ui.toggleQueue();
          return;
        case "toggle-audio-settings": {
          const eq = useAudioEqualizerStore.getState();
          if (eq.isDialogOpen) {
            eq.closeDialog();
          } else {
            eq.openDialog("quality");
          }
          return;
        }
        case "toggle-desktop-controller":
          if (runtime.isDesktop) {
            void runtime.desktopPlaybackWallpaper.showController();
          }
          return;
        case "toggle-desktop-music-mode":
          if (runtime.isDesktop) {
            void runtime.desktopPlaybackWallpaper
              .getModel()
              .then((model) =>
                runtime.desktopPlaybackWallpaper.configure(
                  getDesktopPlaybackWallpaperToggleUpdate(model.preferences),
                ),
              )
              .catch(() => undefined);
          }
          return;
        case "toggle-fullscreen":
          void toggleApplicationFullscreen();
          return;
        case "toggle-developer-tools":
          void toggleApplicationDeveloperTools();
          return;
        case "open-shortcut-settings":
          navigateTo("/setting");
          return;
        case "open-current-track-comments": {
          const track = usePlayerStore.getState().currentSongDetail;
          if (track) {
            navigateTo(
              getCommentHref(
                track.voiceId === undefined ? "song" : "voice",
                track.voiceId ?? track.id,
              ),
            );
          }
          return;
        }
        case "show-shortcut-help":
          ui.setIsShortcutHelpOpen(!ui.isShortcutHelpOpen);
          return;
        case "open-command-palette":
          if (ui.isSearchOpen) {
            useSearchStore.getState().setQuery("");
            ui.setIsSearchOpen(false);
            return;
          }
          useSearchStore.getState().setQuery("> ");
          ui.setIsSearchOpen(true);
      }
    },
    [commands, navigateTo],
  );
}
