"use client";

import { useCallback, useRef } from "react";

import { DEFAULT_VISUALIZER_BACKGROUND_MODE } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  DEFAULT_LATENT_BACKGROUND_TUNING,
  DEFAULT_MONET_BACKGROUND_TUNING,
  DEFAULT_NOMAND_BACKGROUND_TUNING,
  type VisualizerBackgroundMode,
} from "@/components/lyrics/folia/src/types";
import { toggleCurrentSongLike } from "@/lib/player/toggleCurrentSongLike";
import { useLyricStageStore } from "@/store/module/lyrics";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";
import type { LyricVisualizerMode } from "@/types/lyrics";

export function useFoliaPanelControls() {
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const volume = usePlayerStore((state) => state.volume);
  const likedIds = useUserStore((state) => state.likeListIDs);
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
  const previousVolumeRef = useRef(volume || 70);
  const isLiked = currentSong ? likedIds.includes(currentSong.id) : false;

  const toggleMute = useCallback(() => {
    const player = usePlayerStore.getState();
    if (player.volume > 0) {
      previousVolumeRef.current = player.volume;
      player.setVolume(0);
      return;
    }
    player.setVolume(previousVolumeRef.current);
  }, []);

  return {
    currentSong,
    isLiked,
    isPlaying,
    isShuffle,
    latentBackgroundTuning,
    lyricOffsetMs,
    monetBackgroundTuning,
    nomandBackgroundTuning,
    playNext: () => void usePlayerStore.getState().playNext(),
    playPrev: () => void usePlayerStore.getState().playPrev(),
    repeatMode,
    setLyricOffsetMs: (offsetMs: number) =>
      useLyricStageStore.getState().patchSettings({ lyricOffsetMs: offsetMs }),
    setVolume: (nextVolume: number) => usePlayerStore.getState().setVolume(nextVolume),
    toggleLike: () => void toggleCurrentSongLike(),
    toggleMute,
    togglePlay: () => usePlayerStore.getState().togglePlaying(),
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
      useLyricStageStore.getState().patchSettings({ mode }),
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
    volume,
  };
}
