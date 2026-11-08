"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { usePersonalFmDislike } from "@/hooks/personalFm/usePersonalFmDislike";
import { useDailyRecommendationMutation } from "@/hooks/playlist/useDailyRecommendationMutation";
import { clearPageCache } from "@/lib/cache/pageCache";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";
import { pruneSongDetail, type SongDetail } from "@/types/song/api";

export function useNowPlayingDislike(song: SongDetail | null | undefined) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const playlistId = usePlayerStore((s) => s.playlistId);
  const isPersonalFm = isPersonalFmPlaybackSource(playlistId);
  const isDailyRecommend = playlistId === "daily";
  const canDislike = Boolean(song && (isPersonalFm || isDailyRecommend));

  const { dislike: dislikePersonalFm, isDisliking: isDislikingFm } = usePersonalFmDislike();
  const { mutateAsync: dislikeDailyRecommendMutation } = useDailyRecommendationMutation();
  const [isDislikingDaily, setIsDislikingDaily] = useState(false);

  const dislike = useCallback(async () => {
    if (!song) return;

    if (isPersonalFm) {
      await dislikePersonalFm(song);
      return;
    }

    if (isDailyRecommend) {
      setIsDislikingDaily(true);
      try {
        const dislikeResult = await dislikeDailyRecommendMutation(song.id);
        if (!dislikeResult.data) {
          throw new Error("The daily recommendation endpoint did not provide a replacement track.");
        }
        const replaceSong = pruneSongDetail(dislikeResult.data);
        const playerState = usePlayerStore.getState();
        const isCurrentPlaying = playerState.currentSongDetail?.id === song.id;

        const inQueue = playerState.queue.some((s) => s.id === song.id);
        if (inQueue) {
          usePlayerStore.setState({
            queue: playerState.queue.map((s) => (s.id === song.id ? replaceSong : s)),
            originalQueue: playerState.originalQueue.map((s) =>
              s.id === song.id ? replaceSong : s,
            ),
          });
        }

        if (isCurrentPlaying) {
          void playerState.playNext();
        }
        void clearPageCache();
        void queryClient.invalidateQueries({ queryKey: ["playlist", "content", "daily"] });

        toast.success(t("playlist.table.dislikeSuccess"));
      } catch (error) {
        reportActionFailure("playlist.daily_recommendation.dislike", error, { trackId: song.id });
        toast.error(t("playlist.table.operationFailed"));
      } finally {
        setIsDislikingDaily(false);
      }
    }
  }, [
    dislikeDailyRecommendMutation,
    dislikePersonalFm,
    isDailyRecommend,
    isPersonalFm,
    queryClient,
    song,
    t,
  ]);

  return {
    canDislike,
    dislike,
    isDisliking: isDislikingFm || isDislikingDaily,
    isDailyRecommend,
    isPersonalFm,
  };
}
