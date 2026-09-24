"use client";

import { useCallback, useState } from "react";

import { usePlayerStore } from "@/store/module/player";
import type { MusicQuality } from "@/types/player";
import type { ImmerseType } from "@/types/api/music";

export function useMusicQuality() {
  const [isChanging, setIsChanging] = useState(false);
  const changeStoredMusicQuality = usePlayerStore((state) => state.changeMusicQuality);
  const musicQuality = usePlayerStore((state) => state.musicQuality);
  const immerseType = usePlayerStore((state) => state.immerseType);

  const changeMusicQuality = useCallback(
    async (quality: MusicQuality, variant = immerseType) => {
      if ((musicQuality === quality && immerseType === variant) || isChanging) return;

      setIsChanging(true);
      try {
        await changeStoredMusicQuality(quality, variant);
      } finally {
        setIsChanging(false);
      }
    },
    [changeStoredMusicQuality, isChanging, musicQuality, immerseType],
  );

  const changeImmerseType = (variant: ImmerseType) => changeMusicQuality("sky", variant);
  return { changeMusicQuality, changeImmerseType, immerseType, isChanging, musicQuality };
}
