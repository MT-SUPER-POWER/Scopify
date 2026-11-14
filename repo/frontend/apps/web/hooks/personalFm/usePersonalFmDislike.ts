"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { trashPersonalFmSong } from "@/lib/api/personalFm";
import { useTranslation } from "react-i18next";

import { usePersonalFmStore } from "@/store/module/personalFm";
import type { SongDetail } from "@/types/song/api";

/**
 * Provides the one Personal FM-specific negative-feedback flow shared by the
 * Folia controls and the virtual playlist. A successful request is the only
 * point at which local playback state may change.
 */
export function usePersonalFmDislike() {
  const { t } = useTranslation();
  const [isDisliking, setIsDisliking] = useState(false);
  const isDislikingRef = useRef(false);

  const dislike = useCallback(
    async (track: SongDetail): Promise<boolean> => {
      if (isDislikingRef.current) return false;

      isDislikingRef.current = true;
      setIsDisliking(true);
      try {
        await trashPersonalFmSong(track.id);
        await usePersonalFmStore.getState().removeDislikedTrack(track);
        return true;
      } catch (error) {
        console.error("[personal-fm] failed to dislike song", error);
        toast.error(t("personalFm.action.dislikeFailed"));
        return false;
      } finally {
        isDislikingRef.current = false;
        setIsDisliking(false);
      }
    },
    [t],
  );

  return { dislike, isDisliking };
}
