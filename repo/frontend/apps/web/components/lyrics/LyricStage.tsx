"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildAppStyle } from "@/components/lyrics/folia/src/components/app/presentation/buildAppStyle";
import FloatingPlayerControls from "@/components/lyrics/folia/src/components/FloatingPlayerControls";
import { PlayerState } from "@/components/lyrics/folia/src/types";
import { usePlayerChromeAutoHide } from "@/components/lyrics/folia/src/hooks/usePlayerChromeAutoHide";
import {
  FOLIA_THEME_LIBRARY_OPEN_EVENT,
  FOLIA_THEME_LIBRARY_PENDING_KEY,
} from "@/constants/desktopPlaybackController";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { useFoliaPresentationAppearance } from "@/hooks/player/useFoliaPresentationAppearance";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlaybackWakeLock } from "@/hooks/player/usePlaybackWakeLock";
import { useRuntimeWindowVisibility } from "@/hooks/useRuntimeWindowVisibility";
import { usePlayerStore } from "@/store/module/player";
import type { DesktopLyricCommand } from "@/types/desktopLyric";

import { FoliaPresentationSurface } from "./FoliaPresentationSurface";
import { FoliaStageSettings } from "./FoliaStageSettings";

const keepAutoHideEnabled = () => undefined;

/** Scopify host for Folia's pinned playback-stage presentation runtime. */
export function LyricStage({ onClose }: { onClose: () => void }) {
  const [isBorderVisible, setIsBorderVisible] = useState(false);
  const [isPlayerChromeHidden, setIsPlayerChromeHidden] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
  const [themeLibraryRequestId, setThemeLibraryRequestId] = useState(0);
  const [isTransparent, setIsTransparent] = useState(false);
  const isWindowVisible = useRuntimeWindowVisibility();
  const isMainSurfaceActive = !isVisualSettingsOpen && isWindowVisible;
  const appearance = useFoliaPresentationAppearance();
  const bridge = useFoliaPlaybackBridge(isMainSurfaceActive);
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  usePlaybackWakeLock(bridge.isPlaying && isWindowVisible);
  const { assets, isDaylight, settings, theme } = appearance;
  const stageStyle = useMemo(
    () =>
      buildAppStyle({
        bgMode: "default",
        daylightTheme: theme,
        defaultTheme: theme,
        isDaylight,
        theme,
        transparentBackground: isTransparent,
      }),
    [isDaylight, isTransparent, theme],
  );

  const { cyclePlayerChromeVisibilityMode, setPlayerChromeVisibilityMode } =
    usePlayerChromeAutoHide({
      autoHidePlayerChrome: true,
      initialPlayerChromeHidden: false,
      setAutoHidePlayerChromePreference: keepAutoHideEnabled,
      setIsPlayerChromeHidden,
    });

  useEffect(() => {
    const openThemeLibrary = () => {
      try {
        window.sessionStorage.removeItem(FOLIA_THEME_LIBRARY_PENDING_KEY);
      } catch {
        // Opening the theme library does not depend on session storage cleanup.
      }
      setIsSettingsOpen(true);
      setThemeLibraryRequestId((requestId) => requestId + 1);
    };

    try {
      if (window.sessionStorage.getItem(FOLIA_THEME_LIBRARY_PENDING_KEY) === "1") {
        openThemeLibrary();
      }
    } catch {
      // The live event below remains available when session storage is blocked.
    }

    window.addEventListener(FOLIA_THEME_LIBRARY_OPEN_EVENT, openThemeLibrary);
    return () => window.removeEventListener(FOLIA_THEME_LIBRARY_OPEN_EVENT, openThemeLibrary);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.code === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        cyclePlayerChromeVisibilityMode();
      }
      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        setIsSettingsOpen((open) => !open);
      }
    };
    const onDesktopCommand = (event: Event) => {
      const command = (event as CustomEvent<DesktopLyricCommand>).detail;
      if (!command) return;
      if (command.type === "set-stage-transparent") setIsTransparent(command.enabled);
      if (command.type === "set-stage-border-visible") setIsBorderVisible(command.visible);
      if (command.type === "set-stage-controls-visible") {
        setPlayerChromeVisibilityMode(command.visible ? "always-visible" : "always-hidden");
      }
    };
    window.addEventListener("desktop-lyric:stage-command", onDesktopCommand);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("desktop-lyric:stage-command", onDesktopCommand);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [cyclePlayerChromeVisibilityMode, onClose, setPlayerChromeVisibilityMode]);

  const playerState = bridge.isPlaying ? PlayerState.PLAYING : PlayerState.PAUSED;
  const seekToSeconds = useCallback(
    (timeSeconds: number) => {
      void commands.seek(Math.max(0, timeSeconds) * 1_000);
    },
    [commands],
  );
  const seekToAndResume = useCallback(
    (timeSeconds: number) => {
      seekToSeconds(timeSeconds);
      if (!playback.isPlaying) void commands.play();
    },
    [commands, playback.isPlaying, seekToSeconds],
  );

  return (
    <section
      aria-label="Lyrics"
      className={`fixed inset-0 z-100 overflow-hidden text-white ${
        isTransparent ? "bg-transparent" : ""
      } ${isBorderVisible ? "border border-white/30" : ""}`}
      style={stageStyle}
    >
      {isWindowVisible ? (
        <FoliaPresentationSurface
          appearance={appearance}
          bridge={bridge}
          isPlayerChromeHidden={isPlayerChromeHidden}
          layers={{ background: !isTransparent, lyrics: true }}
          onBack={onClose}
          onLyricLineSeek={settings.mode === "monet" ? seekToAndResume : undefined}
          track={
            currentSong
              ? {
                  albumTitle: currentSong.al.name,
                  artistNames: currentSong.ar.map((artist) => artist.name),
                  artworkUrl: currentSong.al.picUrl,
                  durationMs: playback.durationMs,
                  id: currentSong.id,
                  title: currentSong.name,
                }
              : null
          }
        />
      ) : null}

      {isWindowVisible ? (
        <FloatingPlayerControls
          currentSong={currentSong ? { name: currentSong.name } : null}
          playerState={playerState}
          currentTime={bridge.currentTime}
          lyricCurrentTime={bridge.lyricCurrentTime}
          duration={bridge.durationSeconds}
          loopMode={repeatMode}
          currentView="player"
          audioSrc={currentSongUrl}
          canTogglePlay={playback.canControl}
          lyrics={bridge.lyrics}
          onSeek={seekToSeconds}
          onTogglePlay={() => void commands.toggle()}
          onToggleLoop={cycleRepeatMode}
          onNavigateToPlayer={() => undefined}
          primaryColor={theme.primaryColor}
          secondaryColor={theme.secondaryColor}
          theme={theme}
          isDaylight={isDaylight}
          isHidden={isPlayerChromeHidden}
          controlsDisabled={!playback.canControl}
        />
      ) : null}

      {isWindowVisible ? (
        <FoliaStageSettings
          assets={assets}
          isChromeHidden={isPlayerChromeHidden}
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onVisualSettingsOpenChange={setIsVisualSettingsOpen}
          theme={theme}
          themeLibraryRequestId={themeLibraryRequestId}
        />
      ) : null}
    </section>
  );
}

function cycleRepeatMode() {
  const player = usePlayerStore.getState();
  const nextMode =
    player.repeatMode === "off" ? "all" : player.repeatMode === "all" ? "one" : "off";
  player.setRepeatMode(nextMode);
}
