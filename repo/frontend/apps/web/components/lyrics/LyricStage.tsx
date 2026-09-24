"use client";

import { useCallback, useMemo } from "react";

import { buildAppStyle } from "@/components/lyrics/folia/src/components/app/presentation/buildAppStyle";
import FloatingPlayerControls from "@/components/lyrics/folia/src/components/FloatingPlayerControls";
import { PlayerState } from "@/components/lyrics/folia/src/types";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import type { LyricStageProps } from "@/types/components/lyrics";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { useFoliaPresentationAppearance } from "@/hooks/player/useFoliaPresentationAppearance";
import { useFoliaStageControls } from "@/hooks/lyrics/useFoliaStageControls";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlaybackWakeLock } from "@/hooks/player/usePlaybackWakeLock";
import { useRuntimeWindowVisibility } from "@/hooks/useRuntimeWindowVisibility";
import { usePlayerStore } from "@/store/module/player";

import { FoliaPresentationSurface } from "./FoliaPresentationSurface";
import { FoliaStageSettings } from "./FoliaStageSettings";

/** Scopify host for Folia's pinned playback-stage presentation runtime. */
export function LyricStage({ onClose }: LyricStageProps) {
  const {
    isBorderVisible,
    isPlayerChromeHidden,
    isSettingsOpen,
    isTransparent,
    setIsSettingsOpen,
  } = useFoliaStageControls({ onClose });
  const isSettingsModalOpen = useFoliaSettingsStore(
    (state) => state.visualSection !== null || state.themeLibraryOpen,
  );
  const isWindowVisible = useRuntimeWindowVisibility();
  const isMainSurfaceActive = !isSettingsModalOpen && isWindowVisible;
  const appearance = useFoliaPresentationAppearance();
  const bridge = useFoliaPlaybackBridge(isMainSurfaceActive);
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  usePlaybackWakeLock(bridge.isPlaying && isWindowVisible);
  const { isDaylight, settings, theme } = appearance;
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
          isChromeHidden={isPlayerChromeHidden}
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          theme={theme}
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
