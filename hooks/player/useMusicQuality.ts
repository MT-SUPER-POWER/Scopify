"use client";

import { useCallback, useState } from "react";

import { usePlayerStore } from "@/store/module/player";
import type { MusicQuality } from "@/types/player";

export function useMusicQuality() {
  const [isChanging, setIsChanging] = useState(false);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const musicQuality = usePlayerStore((state) => state.musicQuality);
  const setMusicQuality = usePlayerStore((state) => state.setMusicQuality);

  const changeMusicQuality = useCallback(
    async (quality: MusicQuality) => {
      if (musicQuality === quality || isChanging) return;

      setMusicQuality(quality);
      if (!currentSong) return;

      setIsChanging(true);
      try {
        await usePlayerStore.getState().playTrack(currentSong);
      } finally {
        setIsChanging(false);
      }
    },
    [currentSong, isChanging, musicQuality, setMusicQuality],
  );

  return { changeMusicQuality, isChanging, musicQuality };
}
