"use client";

import { useEffect, useMemo, useState } from "react";

import FloatingPlayerControls from "@/components/lyrics/folia/src/components/FloatingPlayerControls";
import VisualizerRenderer from "@/components/lyrics/folia/src/components/visualizer/VisualizerRenderer";
import { buildAppStyle } from "@/components/lyrics/folia/src/components/app/presentation/buildAppStyle";
import { PlayerState, type Theme } from "@/components/lyrics/folia/src/types";
import { usePlayerChromeAutoHide } from "@/components/lyrics/folia/src/hooks/usePlayerChromeAutoHide";
import { useFoliaStageAssets } from "@/hooks/player/useFoliaStageAssets";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { getFoliaStageTheme, getFoliaThemeColors } from "@/lib/lyrics/foliaTheme";
import { usePlayerStore } from "@/store/module/player";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { DesktopLyricCommand } from "@/types/desktopLyric";

import { FoliaStageSettings } from "./FoliaStageSettings";

const keepAutoHideEnabled = () => undefined;

/** Scopify host for Folia's pinned playback-stage presentation runtime. */
export function LyricStage({ onClose }: { onClose: () => void }) {
  const [isBorderVisible, setIsBorderVisible] = useState(false);
  const [isPlayerChromeHidden, setIsPlayerChromeHidden] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const assets = useFoliaStageAssets();
  const bridge = useFoliaPlaybackBridge();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const settings = useLyricStageStore();
  const activeStageTheme = getFoliaStageTheme(settings.themes, settings.themeId);
  const activeThemeColors = getFoliaThemeColors(activeStageTheme, settings.themeVariant);
  const isDaylight = settings.themeVariant === "light";
  const theme = useMemo<Theme>(
    () => ({
      ...activeThemeColors,
      animationIntensity: settings.animationIntensity,
      fontStyle: settings.fontStyle,
      fontFamily: settings.fontFamily ?? undefined,
      fontFamilyStack: [],
      name: isDaylight ? "snow" : settings.themeId,
    }),
    [
      activeThemeColors,
      isDaylight,
      settings.animationIntensity,
      settings.fontFamily,
      settings.fontStyle,
      settings.themeId,
    ],
  );
  const subtitleTheme = useMemo<Theme>(
    () =>
      settings.subtitleFontInheritsLyrics
        ? theme
        : {
            ...theme,
            fontFamily: settings.subtitleFontFamily ?? undefined,
            fontFamilyStack: settings.subtitleFontFallbackFamilies,
            fontStyle: settings.subtitleFontStyle,
          },
    [settings, theme],
  );
  const appStyle = useMemo(
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

  const coverUrl = currentSong?.al.picUrl ?? null;
  const songArtist = currentSong?.ar.map((artist) => artist.name).join(", ") ?? null;
  const playerState = bridge.isPlaying ? PlayerState.PLAYING : PlayerState.PAUSED;

  return (
    <section
      aria-label="Lyrics"
      className={`fixed inset-0 z-100 overflow-hidden text-white ${
        isTransparent ? "bg-transparent" : ""
      } ${isBorderVisible ? "border border-white/30" : ""}`}
      style={{
        ...appStyle,
        backgroundColor: isTransparent ? "transparent" : theme.backgroundColor,
      }}
    >
      <div className="absolute inset-0">
        <VisualizerRenderer
          mode={settings.mode}
          currentTime={bridge.lyricCurrentTime}
          currentLineIndex={bridge.currentLineIndex}
          lines={bridge.lines}
          theme={theme}
          subtitleTheme={subtitleTheme}
          isDaylight={isDaylight}
          audioPower={bridge.audioPower}
          audioBands={bridge.audioBands}
          showText
          songTitle={currentSong?.name ?? null}
          songArtist={songArtist}
          songAlbum={currentSong?.al.name ?? null}
          coverUrl={coverUrl}
          seed={currentSong?.id ?? `geometry-${settings.mode}`}
          staticMode={false}
          backgroundStaticMode={false}
          visualizerOpacity={settings.visualizerOpacity}
          background={{
            ...settings.background,
            customImage: assets.monetBackgroundImage,
            transparent: isTransparent,
            common: {
              ...settings.background.common,
              disableGeometricBackground: settings.background.common?.disableGeometricBackground,
            },
          }}
          lyricsFontScale={settings.fontScale}
          subtitleOverlayOpacity={settings.subtitleOverlayOpacity}
          subtitleOverlayBackground={settings.subtitleOverlayBackground}
          isPlayerChromeHidden={isPlayerChromeHidden}
          hideTranslationSubtitle={settings.hideTranslationSubtitle}
          showSubtitleTranslation={settings.showSubtitleTranslation}
          paused={!bridge.isPlaying}
          onBack={onClose}
          cappellaCustomAvatarImages={assets.cappellaCustomAvatarImages}
          cappellaCustomEmojiImages={assets.cappellaCustomEmojiImages}
          monetPortraitImage={assets.monetPortraitImage}
          onLyricLineSeek={settings.mode === "monet" ? seekToAndResume : undefined}
          visualizerTunings={settings.tunings}
          onCladdaghTuningChange={(patch) => settings.patchTuning("claddagh", patch)}
          onMonetTuningChange={(patch) => settings.patchTuning("monet", patch)}
        />
      </div>

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
