"use client";

import {
  Captions,
  ChartBar,
  Heart,
  ListPlus,
  Repeat,
  Repeat1,
  RepeatOff,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store/module/player";
import type {
  FoliaCapsuleAction,
  FoliaCapsuleActionBinding,
  FoliaCapsuleVolumeAnchor,
  UseFoliaCapsuleActionsOptions,
} from "@/types/player/foliaControls";

export function useFoliaCapsuleActions({
  currentView,
  controlsDisabled,
  hasLyrics,
  loopMode,
  onToggleLoop,
  onToggleTimeline,
  openWorkspace,
}: UseFoliaCapsuleActionsOptions) {
  const { t } = useTranslation();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const [volumeAnchor, setVolumeAnchor] = useState<FoliaCapsuleVolumeAnchor | null>(null);
  const previousVolume = useRef(playback.volume || 70);
  const isPersonalFm = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
  const shuffle = usePlayerStore((state) => state.isShuffle);
  const track = usePlayerStore((state) => state.currentSongDetail);
  const isLoggedIn = useLoginStatus();
  const canLike = isLoggedIn && !!track;
  const canAddToPlaylist = isLoggedIn && !!track && track.voiceId === undefined;
  const onMute = () => {
    if (playback.volume > 0) {
      previousVolume.current = playback.volume;
      void commands.setVolume(0);
    } else {
      void commands.setVolume(previousVolume.current);
    }
  };
  const isPlayer = currentView === "player";
  const actions: Record<FoliaCapsuleAction, FoliaCapsuleActionBinding> = {
    repeat: {
      label: t(
        loopMode === "one" ? "ui.repeatOne" : loopMode === "all" ? "ui.repeatAll" : "ui.repeatOff",
      ),
      Icon: loopMode === "one" ? Repeat1 : loopMode === "all" ? Repeat : RepeatOff,
      enabled: !controlsDisabled,
      pressed: loopMode !== "off",
      run: onToggleLoop,
    },
    timeline: {
      label: t("folia.floatingControls.viewTimeline"),
      Icon: ChartBar,
      enabled: hasLyrics,
      run: onToggleTimeline,
    },
    shuffle: {
      label: t("folia.queue.shuffle"),
      Icon: Shuffle,
      enabled: !controlsDisabled && !isPersonalFm && !!track,
      pressed: shuffle,
      run: () => usePlayerStore.getState().toggleShuffle(),
    },
    like: {
      label: t(playback.liked ? "folia.ui.unlike" : "folia.ui.like"),
      Icon: Heart,
      enabled: !controlsDisabled && canLike,
      pressed: playback.liked,
      run: () => void commands.toggleLike(),
    },
    playlist: {
      label: t("contextMenu.addToPlaylist"),
      Icon: ListPlus,
      enabled: canAddToPlaylist,
      run: () => openWorkspace("folia-add-to-playlist"),
    },
    volume: {
      label: t("folia.ui.volume"),
      Icon: playback.volume === 0 ? VolumeOff : Volume2,
      enabled: !controlsDisabled,
      run: (event) => {
        const trigger = event.currentTarget;
        const rect = trigger.getBoundingClientRect();
        setVolumeAnchor({
          x: event.detail === 0 ? rect.left + rect.width / 2 : event.clientX,
          y: event.detail === 0 ? rect.top + rect.height / 2 : event.clientY,
          trigger,
        });
      },
    },
    visualizers: {
      label: t("folia.options.previewVisualizerSettings"),
      Icon: Sparkles,
      enabled: isPlayer,
      run: () => openWorkspace("folia-visualizers"),
    },
    subtitles: {
      label: t("folia.options.previewSubtitleSettings"),
      Icon: Captions,
      enabled: isPlayer,
      run: () => openWorkspace("folia-subtitles"),
    },
  };

  return {
    actions,
    volumeAnchor,
    closeVolume: () => setVolumeAnchor(null),
    onMute,
  };
}
