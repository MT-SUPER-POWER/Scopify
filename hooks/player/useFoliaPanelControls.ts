"use client";

import { useCallback, useRef } from "react";

import { toggleCurrentSongLike } from "@/lib/player/toggleCurrentSongLike";
import { useLyricStageStore } from "@/store/module/lyrics";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";

export function useFoliaPanelControls() {
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const volume = usePlayerStore((state) => state.volume);
  const likedIds = useUserStore((state) => state.likeListIDs);
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
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
    lyricOffsetMs,
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
    volume,
  };
}
