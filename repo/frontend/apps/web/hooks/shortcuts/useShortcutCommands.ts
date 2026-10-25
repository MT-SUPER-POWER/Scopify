"use client";

import { useCallback } from "react";
import { useUpdatesStore } from "@/store/module/updates";
import { useRouter } from "next/navigation";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { usePlaybackProjectionStore } from "@/hooks/player/usePlaybackProjection";
import { toggleApplicationDeveloperTools } from "@/lib/shortcuts/developerTools";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { getCommentHref } from "@/lib/comment/commentResource";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";
import { usePlayerStore } from "@/store/module/player";
import { useUiStore } from "@/store/module/ui";
import { useSearchStore } from "@/store/module/search";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useAudioOutputStore } from "@/store/module/audioOutput";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useLatticePreferences, useLatticeView } from "@/store/module/lattice";
import { runtime } from "@/lib/runtime";
import type { ShortcutCommandExecutorOptions, ShortcutCommandId } from "@/types/shortcuts";

const VOLUME_STEP = 5;
let muteRestoreLevel: number | null = null;

export function useShortcutCommands(options?: ShortcutCommandExecutorOptions) {
  const router = useRouter();
  // Read playback on demand: subscribing here would re-render the host every frame.
  const playbackStore = usePlaybackProjectionStore();
  const commands = usePlaybackCommands();
  const navigateToOverride = options?.navigateTo;

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
      const { durationMs, volume } = playbackStore.getSnapshot();
      const seekBy = (deltaMs: number) => {
        const unclampedPositionMs = Math.max(0, playbackStore.samplePositionMs() + deltaMs);
        const targetPositionMs =
          durationMs > 0 ? Math.min(durationMs, unclampedPositionMs) : unclampedPositionMs;
        void commands.seek(targetPositionMs);
      };
      switch (commandId) {
        case "toggle-dynamic-island":
          if (runtime.isDesktop) void runtime.dynamicIsland.toggle();
          return;
        case "toggle-taskbar-lyric":
          if (runtime.isDesktop) void runtime.taskbarLyric.toggle();
          return;
        case "open-whats-new":
          useUpdatesStore.getState().open();
          return;
        case "toggle-desktop-subtitle":
          if (runtime.isDesktop) void useDesktopSubtitleControl.getState().toggle();
          return;
        case "toggle-subtitle-controls":
          if (runtime.isDesktop) {
            const control = useDesktopSubtitleControl.getState();
            control.setOpen(!control.open);
          }
          return;
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
          useFoliaSettingsStore.getState().toggleVisualSettings();
          return;
        case "open-folia-theme-library":
          useFoliaSettingsStore.getState().toggleThemeLibrary();
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
        case "toggle-audio-output-device":
          useAudioOutputStore.getState().togglePopover();
          return;
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
        case "playlist-view-list": {
          const latticeView = useLatticeView.getState();
          if (latticeView.active) latticeView.controller?.close();
          return;
        }
        case "playlist-view-lattice": {
          const latticeView = useLatticeView.getState();
          if (!latticeView.active) latticeView.controller?.open();
          return;
        }
        case "toggle-lattice-lights-off": {
          const preferences = useLatticePreferences.getState();
          preferences.setLightsOff(!preferences.lightsOff);
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
    [commands, navigateTo, playbackStore],
  );
}
