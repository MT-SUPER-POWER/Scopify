"use client";

import { useCallback, useRef } from "react";

import { DEFAULT_VISUALIZER_BACKGROUND_MODE } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  DEFAULT_LATENT_BACKGROUND_TUNING,
  DEFAULT_MONET_BACKGROUND_TUNING,
  DEFAULT_NOMAND_BACKGROUND_TUNING,
  type VisualizerBackgroundMode,
} from "@/components/lyrics/folia/src/types";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useLyricStageStore } from "@/store/module/lyrics";
import { usePlayerStore } from "@/store/module/player";
import type { LyricVisualizerMode } from "@/types/lyrics";

export function useFoliaPanelControls() {
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const animationIntensity = useLyricStageStore((state) => state.animationIntensity);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const visualizerMode = useLyricStageStore((state) => state.mode);
  const visualizerBackgroundMode = useLyricStageStore(
    (state) => state.background.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE,
  );
  const useCoverColorBg = useLyricStageStore(
    (state) => state.background.common?.useCoverColorBg ?? false,
  );
  const monetBackgroundTuning = useLyricStageStore(
    (state) => state.background.monet?.tuning ?? DEFAULT_MONET_BACKGROUND_TUNING,
  );
  const nomandBackgroundTuning = useLyricStageStore(
    (state) => state.background.nomand?.tuning ?? DEFAULT_NOMAND_BACKGROUND_TUNING,
  );
  const latentBackgroundTuning = useLyricStageStore(
    (state) => state.background.latent?.tuning ?? DEFAULT_LATENT_BACKGROUND_TUNING,
  );
  const previousVolumeRef = useRef(playback.volume || 70);

  const toggleMute = useCallback(() => {
    if (playback.volume > 0) {
      previousVolumeRef.current = playback.volume;
      void commands.setVolume(0);
      return;
    }
    void commands.setVolume(previousVolumeRef.current);
  }, [commands, playback.volume]);

  return {
    animationIntensity,
    cycleAnimationIntensity: () => {
      const lyricStage = useLyricStageStore.getState();
      const intensityLevels = ["calm", "normal", "chaotic"] as const;
      const currentIndex = intensityLevels.indexOf(lyricStage.animationIntensity);
      lyricStage.patchSettings({
        animationIntensity: intensityLevels[(currentIndex + 1) % intensityLevels.length],
      });
    },
    currentSong,
    isLiked: playback.liked,
    isPlaying: playback.isPlaying,
    isShuffle,
    latentBackgroundTuning,
    lyricOffsetMs,
    monetBackgroundTuning,
    nomandBackgroundTuning,
    playNext: () => void commands.next(),
    playPrev: () => void commands.previous(),
    repeatMode,
    setLyricOffsetMs: (offsetMs: number) =>
      useLyricStageStore.getState().patchSettings({ lyricOffsetMs: offsetMs }),
    setVolume: (nextVolume: number) => void commands.setVolume(nextVolume),
    toggleLike: () => void commands.toggleLike(),
    toggleMute,
    togglePlay: () => void commands.toggle(),
    toggleRepeat: () => {
      const player = usePlayerStore.getState();
      player.setRepeatMode(
        player.repeatMode === "off" ? "all" : player.repeatMode === "all" ? "one" : "off",
      );
    },
    toggleShuffle: () => usePlayerStore.getState().toggleShuffle(),
    setVisualizerBackgroundMode: (mode: VisualizerBackgroundMode) =>
      useLyricStageStore.getState().setBackgroundMode(mode),
    setVisualizerMode: (mode: LyricVisualizerMode) =>
      useLyricStageStore.getState().requestVisualizerMode(mode),
    toggleLatentBackgroundOverlay: () => {
      const lyricStage = useLyricStageStore.getState();
      lyricStage.patchLatentBackground({
        overlayEnabled: !(lyricStage.background.latent?.tuning?.overlayEnabled ?? true),
      });
    },
    cycleLatentBackgroundDisplayMode: () => {
      const lyricStage = useLyricStageStore.getState();
      const currentDisplayMode =
        lyricStage.background.latent?.tuning?.displayMode ??
        DEFAULT_LATENT_BACKGROUND_TUNING.displayMode;
      const displayModes = ["dithering", "mesh", "both"] as const;
      const currentIndex = displayModes.indexOf(currentDisplayMode);
      lyricStage.patchLatentBackground({
        displayMode: displayModes[(currentIndex + 1) % displayModes.length],
      });
    },
    toggleCoverColorBackground: () => {
      const lyricStage = useLyricStageStore.getState();
      lyricStage.patchBackgroundCommon({
        useCoverColorBg: !lyricStage.background.common?.useCoverColorBg,
      });
    },
    toggleMonetBackgroundLayout: () => {
      const lyricStage = useLyricStageStore.getState();
      lyricStage.patchMonetBackground({
        backgroundLayout:
          lyricStage.background.monet?.tuning?.backgroundLayout === "full-overlay"
            ? "half-pane-gradient"
            : "full-overlay",
      });
    },
    toggleNomandBackgroundOverlay: () => {
      const lyricStage = useLyricStageStore.getState();
      lyricStage.patchNomandBackground({
        overlayEnabled: !(lyricStage.background.nomand?.tuning?.overlayEnabled ?? true),
      });
    },
    useCoverColorBg,
    visualizerBackgroundMode,
    visualizerMode,
    volume: playback.volume,
  };
}
