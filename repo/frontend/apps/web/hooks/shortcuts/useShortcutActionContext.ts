"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjectionStore } from "@/hooks/player/usePlaybackProjection";
import { toggleApplicationDeveloperTools } from "@/lib/shortcuts/developerTools";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { getCommentHref } from "@/lib/comment/commentResource";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useUiStore } from "@/store/module/ui";
import { useSearchStore } from "@/store/module/search";
import { useUpdatesStore } from "@/store/module/updates";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useAudioOutputStore } from "@/store/module/audioOutput";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useLatticePreferences, useLatticeView } from "@/store/module/lattice";
import type { ShortcutActionContext, ShortcutCommandExecutorOptions } from "@/types/shortcuts";

let muteRestoreLevel: number | null = null;

/** Inject capabilities, reading stores on demand instead of subscribing to playback frames. */
export function useShortcutActionContext(
  options?: ShortcutCommandExecutorOptions,
): ShortcutActionContext {
  const router = useRouter();
  const playbackStore = usePlaybackProjectionStore();
  const commands = usePlaybackCommands();
  const navigateToOverride = options?.navigateTo;
  const focusPlaylistSearch = options?.focusPlaylistSearch;

  return useMemo<ShortcutActionContext>(() => {
    const navigateTo = (path: string) => {
      if (navigateToOverride) navigateToOverride(path);
      else router.push(path, { scroll: false });
    };
    return {
      playback: {
        toggle: () => {
          void commands.toggle();
        },
        toggleLike: () => {
          void commands.toggleLike();
        },
        previous: () => {
          void commands.previous();
        },
        next: () => {
          void commands.next();
        },
        adjustVolume: (delta) => {
          const { volume } = playbackStore.getSnapshot();
          void commands.setVolume(Math.min(100, Math.max(0, volume + delta)));
        },
        toggleMute: () => {
          const { volume } = playbackStore.getSnapshot();
          if (volume > 0) {
            muteRestoreLevel = volume;
            void commands.setVolume(0);
          } else if (muteRestoreLevel !== null) {
            void commands.setVolume(muteRestoreLevel);
          }
        },
        seekBy: (deltaMs) => {
          const { durationMs } = playbackStore.getSnapshot();
          const positionMs = Math.max(0, playbackStore.samplePositionMs() + deltaMs);
          void commands.seek(durationMs > 0 ? Math.min(durationMs, positionMs) : positionMs);
        },
      },
      navigation: {
        navigateTo,
        navigateHome: () => {
          const ui = useUiStore.getState();
          if (ui.isLyricsOpen) ui.setIsLyricsOpen(false);
          navigateTo("/");
        },
        back: () => {
          if (runtime.isDesktop) window.history.back();
        },
        forward: () => {
          if (runtime.isDesktop) window.history.forward();
        },
      },
      ui: {
        toggleSearch: () => {
          const ui = useUiStore.getState();
          ui.setIsSearchOpen(!ui.isSearchOpen);
        },
        toggleCommandPalette: () => {
          const ui = useUiStore.getState();
          if (ui.isSearchOpen) {
            useSearchStore.getState().setQuery("");
            ui.setIsSearchOpen(false);
            return;
          }
          useSearchStore.getState().setQuery("> ");
          ui.setIsSearchOpen(true);
        },
        toggleSidebar: () => useUiStore.getState().toggleSidebar(),
        toggleQueue: () => useUiStore.getState().toggleQueue(),
        toggleNowPlayingPanel: () => useUiStore.getState().toggleNowPlayingPanel(),
        toggleShortcutHelp: () => {
          const ui = useUiStore.getState();
          ui.setIsShortcutHelpOpen(!ui.isShortcutHelpOpen);
        },
      },
      folia: {
        toggleLyricStage: () => useUiStore.getState().toggleLyrics(),
        toggleStageSettings: () => {
          const ui = useUiStore.getState();
          if (!ui.isLyricsOpen) {
            ui.setIsLyricsOpen(true);
            useFoliaSettingsStore.getState().setStagePanelOpen(true);
          } else {
            useFoliaSettingsStore.getState().toggleStagePanel();
          }
        },
        openFoliaSettings: () => useFoliaSettingsStore.getState().toggleVisualSettings(),
        openFoliaThemeLibrary: () => useFoliaSettingsStore.getState().toggleThemeLibrary(),
      },
      audio: {
        toggleAudioSettings: () => {
          const eq = useAudioEqualizerStore.getState();
          if (eq.isDialogOpen) eq.closeDialog();
          else eq.openDialog("quality");
        },
        toggleAudioOutputDevice: () => useAudioOutputStore.getState().togglePopover(),
      },
      desktop: {
        toggleDynamicIsland: () => {
          if (runtime.isDesktop) void runtime.dynamicIsland.toggle();
        },
        toggleTaskbarLyric: () => {
          if (runtime.isDesktop) void runtime.taskbarLyric.toggle();
        },
        toggleDesktopSubtitle: () => {
          if (runtime.isDesktop) void useDesktopSubtitleControl.getState().toggle();
        },
        toggleSubtitleControls: () => {
          if (!runtime.isDesktop) return;
          const control = useDesktopSubtitleControl.getState();
          control.setOpen(!control.open);
        },
        toggleDesktopController: () => {
          if (runtime.isDesktop) void runtime.desktopPlaybackWallpaper.showController();
        },
        toggleDesktopMusicMode: () => {
          if (!runtime.isDesktop) return;
          void runtime.desktopPlaybackWallpaper
            .getModel()
            .then((model) =>
              runtime.desktopPlaybackWallpaper.configure(
                getDesktopPlaybackWallpaperToggleUpdate(model.preferences),
              ),
            )
            .catch(() => undefined);
        },
        toggleFullscreen: () => {
          void toggleApplicationFullscreen();
        },
        toggleDeveloperTools: () => {
          void toggleApplicationDeveloperTools();
        },
      },
      lattice: {
        viewList: () => {
          const view = useLatticeView.getState();
          if (view.active) view.controller?.close();
        },
        viewLattice: () => {
          const view = useLatticeView.getState();
          if (!view.active) view.controller?.open();
        },
        toggleLightsOff: () => {
          const preferences = useLatticePreferences.getState();
          preferences.setLightsOff(!preferences.lightsOff);
        },
      },
      playlist: { focusSearch: () => focusPlaylistSearch?.() },
      track: {
        openCurrentComments: () => {
          const track = usePlayerStore.getState().currentSongDetail;
          if (track)
            navigateTo(
              getCommentHref(
                track.voiceId === undefined ? "song" : "voice",
                track.voiceId ?? track.id,
              ),
            );
        },
      },
      updates: { openWhatsNew: () => useUpdatesStore.getState().open() },
    };
  }, [commands, focusPlaylistSearch, navigateToOverride, playbackStore, router]);
}
