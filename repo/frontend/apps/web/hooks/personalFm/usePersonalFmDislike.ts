"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { trashPersonalFmSong } from "@/lib/api/personalFm";
import { dislikePersonalFmTrack } from "@/lib/personalFm/dislike";
import { useI18n } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";

/**
 * Provides the one Personal FM-specific negative-feedback flow shared by the
 * Folia controls and the virtual playlist. A successful request is the only
 * point at which local playback state may change.
 */
export function usePersonalFmDislike() {
  const { t } = useI18n();
  const [isDisliking, setIsDisliking] = useState(false);
  const isDislikingRef = useRef(false);

  const dislike = useCallback(
    async (track: SongDetail): Promise<boolean> => {
      const player = usePlayerStore.getState();
      if (!isPersonalFmPlaybackSource(player.playlistId) || isDislikingRef.current) return false;

      isDislikingRef.current = true;
      setIsDisliking(true);
      try {
        await dislikePersonalFmTrack(track, {
          advance: (source) => usePersonalFmStore.getState().advance(source),
          getPlayer: () => {
            const currentPlayer = usePlayerStore.getState();
            return {
              queue: currentPlayer.queue,
              queueIndex: currentPlayer.queueIndex,
              removeQueueItem: currentPlayer.removeQueueItem,
            };
          },
          trash: async (songId) => {
            await trashPersonalFmSong(songId);
          },
        });
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
