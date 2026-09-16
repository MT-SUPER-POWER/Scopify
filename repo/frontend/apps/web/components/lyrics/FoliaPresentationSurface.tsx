"use client";

import { useEffect, useMemo, useRef } from "react";

import { buildAppStyle } from "@/components/lyrics/folia/src/components/app/presentation/buildAppStyle";
import VisualizerBackgroundRenderer from "@/components/lyrics/folia/src/components/visualizer/backgrounds/VisualizerBackgroundRenderer";
import VisualizerRenderer from "@/components/lyrics/folia/src/components/visualizer/VisualizerRenderer";
import VisualizerShell from "@/components/lyrics/folia/src/components/visualizer/VisualizerShell";
import { VISUALIZER_REGISTRY } from "@/components/lyrics/folia/src/components/visualizer/registry";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaPresentationSurfaceProps } from "@/types/foliaStage";

export function FoliaPresentationSurface({
  appearance,
  bridge,
  isPlayerChromeHidden = true,
  layers,
  onBack,
  onLyricLineSeek,
  staticMode = false,
  track,
}: FoliaPresentationSurfaceProps) {
  const observedTrackIdRef = useRef<string | null>(null);
  const wasRandomEnabledRef = useRef(appearance.settings.randomVisualizerMode);

  useEffect(() => {
    const trackId = track?.id ? String(track.id) : null;
    const wasEnabled = wasRandomEnabledRef.current;
    wasRandomEnabledRef.current = appearance.settings.randomVisualizerMode;
    if (!appearance.settings.randomVisualizerMode || !wasEnabled) {
      observedTrackIdRef.current = trackId;
      return;
    }
    if (!trackId || observedTrackIdRef.current === null) {
      observedTrackIdRef.current = trackId;
      return;
    }
    if (observedTrackIdRef.current === trackId) return;
    observedTrackIdRef.current = trackId;
    const candidates = VISUALIZER_REGISTRY.map((entry) => entry.mode).filter(
      (mode) => mode !== appearance.settings.mode,
    );
    const nextMode = candidates[Math.floor(Math.random() * candidates.length)];
    if (nextMode) useLyricStageStore.getState().requestVisualizerMode(nextMode);
  }, [appearance.settings.mode, appearance.settings.randomVisualizerMode, track?.id]);
  const { assets, isDaylight, settings, subtitleTheme, theme } = appearance;
  const transparentBackground = !layers.background;
  const hostRhineBackground = layers.background && settings.background.mode === "rhine";
  const appStyle = useMemo(
    () =>
      buildAppStyle({
        bgMode: "default",
        daylightTheme: theme,
        defaultTheme: theme,
        isDaylight,
        theme,
        transparentBackground,
      }),
    [isDaylight, theme, transparentBackground],
  );
  const background = {
    ...settings.background,
    customImage: assets.monetBackgroundImage,
    transparent: transparentBackground,
    common: {
      ...settings.background.common,
      disableGeometricBackground: settings.background.common?.disableGeometricBackground,
    },
  };
  // Song-keyed lyric directors (and random mode changes) can remount their entire shell.
  // Rhine's canvas and scene belong to the stage so track changes reach the existing animation.
  const lyricBackground = hostRhineBackground
    ? { ...background, renderedByHost: true }
    : background;

  if (!layers.background && !layers.lyrics) return null;

  const sharedProps = {
    alwaysShowBackButton: false,
    background: lyricBackground,
    backgroundStaticMode: staticMode,
    coverUrl: track?.artworkUrl ?? null,
    songTitle: track?.title ?? null,
    isDaylight,
    onBack,
    paused: !bridge.isPlaying,
    seed: track?.id ?? `geometry-${settings.mode}`,
    staticMode,
    visualizerOpacity: settings.visualizerOpacity,
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        ...appStyle,
        backgroundColor: transparentBackground ? "transparent" : theme.backgroundColor,
      }}
    >
      {hostRhineBackground ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: settings.visualizerOpacity }}
        >
          <VisualizerBackgroundRenderer
            config={background}
            theme={theme}
            isDaylight={isDaylight}
            coverUrl={track?.artworkUrl ?? null}
            songTitle={track?.title ?? null}
            audioPower={bridge.audioPower}
            audioBands={bridge.audioBands}
            seed={track?.id}
            staticMode={staticMode}
            paused={!bridge.isPlaying}
          />
        </div>
      ) : null}
      {layers.lyrics ? (
        <VisualizerRenderer
          mode={settings.mode}
          harmonySubtitleBackground={settings.harmonySubtitleBackground}
          showHarmonySubtitle={settings.showHarmonySubtitle}
          currentTime={bridge.lyricCurrentTime}
          currentLineIndex={bridge.currentLineIndex}
          lines={bridge.lines}
          theme={theme}
          subtitleTheme={subtitleTheme}
          isDaylight={isDaylight}
          audioPower={bridge.audioPower}
          audioBands={bridge.audioBands}
          showText
          songTitle={track?.title ?? null}
          songArtist={track?.artistNames.join(", ") ?? null}
          songAlbum={track?.albumTitle ?? null}
          coverUrl={track?.artworkUrl ?? null}
          seed={sharedProps.seed}
          staticMode={staticMode}
          backgroundStaticMode={staticMode}
          visualizerOpacity={settings.visualizerOpacity}
          background={lyricBackground}
          lyricsFontScale={settings.fontScale}
          subtitleFontScale={settings.subtitleFontScale}
          subtitleOverlayOpacity={settings.subtitleOverlayOpacity}
          subtitleOverlayBackground={settings.subtitleOverlayBackground}
          isPlayerChromeHidden={isPlayerChromeHidden}
          hideTranslationSubtitle={settings.hideTranslationSubtitle}
          showSubtitleTranslation={settings.showSubtitleTranslation}
          subtitleContentMode={settings.subtitleContentMode}
          paused={!bridge.isPlaying}
          onBack={onBack}
          cappellaCustomAvatarImages={assets.cappellaCustomAvatarImages}
          cappellaCustomEmojiImages={assets.cappellaCustomEmojiImages}
          monetPortraitImage={assets.monetPortraitImage}
          onLyricLineSeek={onLyricLineSeek}
          visualizerTunings={settings.tunings}
          onCladdaghTuningChange={(patch) => settings.patchTuning("claddagh", patch)}
          onMonetTuningChange={(patch) => settings.patchTuning("monet", patch)}
        />
      ) : (
        <VisualizerShell
          audioBands={bridge.audioBands}
          audioPower={bridge.audioPower}
          sharedProps={sharedProps}
          theme={theme}
        >
          {null}
        </VisualizerShell>
      )}
    </div>
  );
}
