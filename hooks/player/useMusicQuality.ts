"use client";

import { useCallback, useState } from "react";

import { usePlayerStore } from "@/store/module/player";
import type { MusicQuality } from "@/types/player";

export function useMusicQuality() {
  const [isChanging, setIsChanging] = useState(false);
  const changeStoredMusicQuality = usePlayerStore((state) => state.changeMusicQuality);
  const musicQuality = usePlayerStore((state) => state.musicQuality);

  const changeMusicQuality = useCallback(
    async (quality: MusicQuality) => {
      if (musicQuality === quality || isChanging) return;

      setIsChanging(true);
      try {
        await changeStoredMusicQuality(quality);
      } finally {
        setIsChanging(false);
      }
    },
    [changeStoredMusicQuality, isChanging, musicQuality],
  );

  return { changeMusicQuality, isChanging, musicQuality };
}
