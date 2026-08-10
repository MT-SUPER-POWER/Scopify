"use client";

import { useEffect, useMemo, useState } from "react";

import { buildAppStyle } from "@/components/lyrics/folia/src/components/app/presentation/buildAppStyle";
import FloatingPlayerControls from "@/components/lyrics/folia/src/components/FloatingPlayerControls";
import { PlayerState } from "@/components/lyrics/folia/src/types";
import { usePlayerChromeAutoHide } from "@/components/lyrics/folia/src/hooks/usePlayerChromeAutoHide";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { useFoliaPresentationAppearance } from "@/hooks/player/useFoliaPresentationAppearance";
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
  const [isTransparent, setIsTransparent] = useState(false);
  const appearance = useFoliaPresentationAppearance();
  const bridge = useFoliaPlaybackBridge();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("desktop-lyric:stage-command", onDesktopCommand);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cyclePlayerChromeVisibilityMode, onClose, setPlayerChromeVisibilityMode]);

  const playerState = bridge.isPlaying ? PlayerState.PLAYING : PlayerState.PAUSED;

  return (
    <section
      aria-label="Lyrics"
      className={`fixed inset-0 z-100 overflow-hidden text-white ${
        isTransparent ? "bg-transparent" : ""
      } ${isBorderVisible ? "border border-white/30" : ""}`}
      style={stageStyle}
    >
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
                durationMs: currentSong.dt,
                id: currentSong.id,
                title: currentSong.name,
              }
            : null
        }
      />

      <FloatingPlayerControls
        currentSong={currentSong ? { name: currentSong.name } : null}
        playerState={playerState}
        currentTime={bridge.currentTime}
        lyricCurrentTime={bridge.lyricCurrentTime}
        duration={bridge.durationSeconds}
        loopMode={repeatMode}
        currentView="player"
        audioSrc={currentSongUrl}
        canTogglePlay={Boolean(currentSongUrl)}
        lyrics={bridge.lyrics}
        onSeek={seekToSeconds}
        onTogglePlay={() => usePlayerStore.getState().togglePlaying()}
        onToggleLoop={cycleRepeatMode}
        onNavigateToPlayer={() => undefined}
        primaryColor={theme.primaryColor}
        secondaryColor={theme.secondaryColor}
        theme={theme}
        isDaylight={isDaylight}
        isHidden={isPlayerChromeHidden}
        controlsDisabled={!currentSongUrl}
      />

      <FoliaStageSettings
        assets={assets}
        isChromeHidden={isPlayerChromeHidden}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        theme={theme}
      />
    </section>
  );
}

function seekToAndResume(timeSeconds: number) {
  seekToSeconds(Math.max(0, timeSeconds));
  const player = usePlayerStore.getState();
  if (!player.isPlaying) player.togglePlaying();
}

function cycleRepeatMode() {
  const player = usePlayerStore.getState();
  const nextMode =
    player.repeatMode === "off" ? "all" : player.repeatMode === "all" ? "one" : "off";
  player.setRepeatMode(nextMode);
}

function seekToSeconds(timeSeconds: number) {
  window.dispatchEvent(new CustomEvent("player-seek", { detail: timeSeconds * 1_000 }));
}
