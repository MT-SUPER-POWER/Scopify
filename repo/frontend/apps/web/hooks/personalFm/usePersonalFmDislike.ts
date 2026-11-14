"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import {
  adaptNeteaseTrack,
  getPlayerTrackOfNeteaseSong,
} from "@/lib/providers/netease/adapters/track";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
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
  const provider = useActiveProvider();
  const [isDisliking, setIsDisliking] = useState(false);
  const isDislikingRef = useRef(false);

  const dislike = useCallback(
    async (track: SongDetail): Promise<boolean> => {
      if (isDislikingRef.current) return false;

      isDislikingRef.current = true;
      setIsDisliking(true);
      try {
        if (!provider.dislikePersonalFmTrack) {
          throw new Error("Personal FM dislike is unsupported.");
        }
        const queuedTrack = getPlayerTrackOfNeteaseSong(track) ?? adaptNeteaseTrack(track);
        await provider.dislikePersonalFmTrack(queuedTrack.ref);
        await usePersonalFmStore.getState().removeDislikedTrack(queuedTrack);
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
    [provider, t],
  );

  return { dislike, isDisliking };
}
