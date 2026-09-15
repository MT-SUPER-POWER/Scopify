"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
  getHistoricalDailyRecommendationDetail,
  getPlaylistAllTracks,
  getPlaylsitDetail,
} from "@/lib/api/playlist";
import { getRecommendedSongs } from "@/lib/api/track";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";
import {
  prunePlaylistTracks,
  type HistoricalDailyRecommendationDetailResponse,
  type PlaylistContent,
  type PlaylistContentRequest,
  type RawNeteasePlaylist,
} from "@/types/api/playlist";

function getHistoricalSongs(
  response: HistoricalDailyRecommendationDetailResponse,
): RawSongDetail[] {
  const songs = response.data?.dailySongs ?? response.data?.songs;
  return Array.isArray(songs) ? songs : [];
}

async function fetchPlaylistContent({
  dailyDate,
  isDailyRecommendation,
  isRecommend,
  playlistId,
}: PlaylistContentRequest): Promise<PlaylistContent> {
  if (isDailyRecommendation) {
    const dailySongs = dailyDate
      ? getHistoricalSongs((await getHistoricalDailyRecommendationDetail(dailyDate)).data)
      : ((await getRecommendedSongs()).data?.data?.dailySongs ?? []);
    const rawDetail: RawNeteasePlaylist = {
      trackCount: dailySongs.length,
      tracks: dailySongs,
    };

    return {
      rawDetail,
      tracks: dailySongs.map(pruneSongDetail),
    };
  }

  if (!playlistId) throw new Error("Playlist ID is required.");

  const [detailResponse, trackResponse] = await Promise.all([
    getPlaylsitDetail({ id: playlistId, requiresMusicSession: isRecommend }),
    getPlaylistAllTracks({ id: playlistId, limit: 1000, requiresMusicSession: isRecommend }),
  ]);
  const rawDetail = detailResponse.data.playlist;
  if (!rawDetail) throw new Error("Playlist detail is missing.");
  const tracks = prunePlaylistTracks(trackResponse.data);
  const trackCount = rawDetail.trackIds?.length ?? rawDetail.trackCount ?? 0;
  if (trackCount > 1000) {
    const remainder = await getPlaylistAllTracks({
      id: playlistId,
      offset: 1000,
      limit: trackCount - 1000,
      requiresMusicSession: isRecommend,
    });
    tracks.push(...prunePlaylistTracks(remainder.data));
  }

  return {
    rawDetail,
    tracks,
  };
}

export function usePlaylistContentQuery(request: PlaylistContentRequest) {
  const queryClient = useQueryClient();
  const { dailyCacheDate, isDailyRecommendation, isRecommend, playlistId } = request;
  const queryKey = useMemo(
    () =>
      isDailyRecommendation
        ? musicQueryKeys.playlist.daily(dailyCacheDate)
        : musicQueryKeys.playlist.content(playlistId ?? "", isRecommend),
    [dailyCacheDate, isDailyRecommendation, isRecommend, playlistId],
  );
  const query = useQuery({
    enabled: isDailyRecommendation || Boolean(playlistId),
    meta: {
      persist: true,
      scope: "account",
    },
    queryFn: () => fetchPlaylistContent(request),
    queryKey,
  });

  const setTracks = useCallback(
    (tracks: SongDetail[]) => {
      queryClient.setQueryData<PlaylistContent>(queryKey, (content) =>
        content ? { ...content, tracks } : content,
      );
    },
    [queryClient, queryKey],
  );

  return {
    ...query,
    setTracks,
  };
}
