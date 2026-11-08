"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { usePersonalFmDislike } from "@/hooks/personalFm/usePersonalFmDislike";
import { useDailyRecommendationMutation } from "@/hooks/playlist/useDailyRecommendationMutation";
import { clearPageCache } from "@/lib/cache/pageCache";
import { adaptNeteaseTrack, getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";
import type { PlayerTrack } from "@/types/player/model";
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
        const replaceSong = adaptNeteaseTrack(pruneSongDetail(dislikeResult.data));
        const playerState = usePlayerStore.getState();
        const isCurrentPlaying = getNeteaseTrackId(playerState.currentTrack) === song.id;
        const isDisliked = (track: PlayerTrack) => getNeteaseTrackId(track) === song.id;

        const inQueue = playerState.queue.some(isDisliked);
        if (inQueue) {
          usePlayerStore.setState({
            queue: playerState.queue.map((s) => (isDisliked(s) ? replaceSong : s)),
            originalQueue: playerState.originalQueue.map((s) => (isDisliked(s) ? replaceSong : s)),
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
