"use client";

import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDailyRecommendationMutation } from "@/hooks/playlist/useDailyRecommendationMutation";
import { clearPageCache } from "@/lib/cache/pageCache";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { usePlayerStore } from "@/store/module/player";
import { adaptNeteaseTrack, getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";
import type { PlayerTrack } from "@/types/player/model";
import { pruneSongDetail } from "@/types/song/api";

export function useDailyRecommendationDislike(
  tracks: PlayerTrack[],
  onTracksChange?: (tracks: PlayerTrack[]) => void,
) {
  const { t } = useTranslation();
  const { mutateAsync: dislikeDailyRecommend } = useDailyRecommendationMutation();
  const inFlight = useRef(false);

  const dislikeDailyTrack = useCallback(
    async (trackId: number) => {
      if (!onTracksChange || inFlight.current) return;
      inFlight.current = true;
      try {
        const dislikeResult = await dislikeDailyRecommend(trackId);
        if (!dislikeResult.data) {
          throw new Error("The daily recommendation endpoint did not provide a replacement track.");
        }
        const replaceSong = pruneSongDetail(dislikeResult.data);
        const replaceTrack = adaptNeteaseTrack(replaceSong);

        const nextTracks = tracks.map((track) =>
          getNeteaseTrackId(track) === trackId ? replaceTrack : track,
        );

        onTracksChange(nextTracks);

        const playerState = usePlayerStore.getState();
        const isCurrentPlaying =
          playerState.playlistId === "daily" &&
          getNeteaseTrackId(playerState.currentTrack) === trackId;

        // 如果该歌曲已在播放队列中，静默将队列和原始队列中的对应曲目替换为新推荐歌曲
        const inQueue = playerState.queue.some((s) => getNeteaseTrackId(s) === trackId);
        if (playerState.playlistId === "daily" && inQueue) {
          usePlayerStore.setState({
            queue: playerState.queue.map((s) =>
              getNeteaseTrackId(s) === trackId ? replaceTrack : s,
            ),
            originalQueue: playerState.originalQueue.map((s) =>
              getNeteaseTrackId(s) === trackId ? replaceTrack : s,
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
