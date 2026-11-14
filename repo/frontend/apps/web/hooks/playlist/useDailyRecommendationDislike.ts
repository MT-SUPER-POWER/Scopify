"use client";

import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDailyRecommendationMutation } from "@/hooks/playlist/useDailyRecommendationMutation";
import { clearPageCache } from "@/lib/cache/pageCache";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { usePlayerStore } from "@/store/module/player";

import { pruneSongDetail, type SongDetail } from "@/types/song/api";

export function useDailyRecommendationDislike(
  tracks: SongDetail[],
  onTracksChange?: (tracks: SongDetail[]) => void,
) {
  const { t } = useTranslation();
  const { mutateAsync: dislikeDailyRecommend } = useDailyRecommendationMutation();
  const inFlight = useRef(false);

  const dislikeDailyTrack = useCallback(
    async (trackId: number | string) => {
      if (!onTracksChange || inFlight.current) return;
      inFlight.current = true;
      try {
        const dislikeResult = await dislikeDailyRecommend(trackId);
        if (!dislikeResult.data) {
          throw new Error("The daily recommendation endpoint did not provide a replacement track.");
        }
        const replaceSong = pruneSongDetail(dislikeResult.data);

        const nextTracks = tracks.map((track) => (track.id === trackId ? replaceSong : track));

        onTracksChange(nextTracks);

        const playerState = usePlayerStore.getState();
        const isCurrentPlaying =
          playerState.playlistId === "daily" && playerState.currentSongDetail?.id === trackId;

        // 如果该歌曲已在播放队列中，静默将队列和原始队列中的对应曲目替换为新推荐歌曲
        const inQueue = playerState.queue.some((s) => s.id === trackId);
        if (playerState.playlistId === "daily" && inQueue) {
          usePlayerStore.setState({
            queue: playerState.queue.map((s) => (s.id === trackId ? replaceSong : s)),
            originalQueue: playerState.originalQueue.map((s) =>
              s.id === trackId ? replaceSong : s,
            ),
          });
        }

        // 只有当前被标记为不感兴趣的歌曲正在播放时，才执行切歌
        if (isCurrentPlaying) {
          void playerState.playNext();
        }
        void clearPageCache();

        toast.success(t("playlist.table.dislikeSuccess"));
      } catch (error) {
        reportActionFailure("playlist.daily_recommendation.dislike", error, { trackId });
        toast.error(t("playlist.table.operationFailed"));
      } finally {
        inFlight.current = false;
      }
    },
    [dislikeDailyRecommend, t, tracks, onTracksChange],
  );

  return dislikeDailyTrack;
}
