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
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/song/api";
import {
  prunePlaylistTracks,
  type HistoricalDailyRecommendationDetailResponse,
  type PlaylistContent,
  type PlaylistContentRequest,
  type RawNeteasePlaylist,
} from "@/types/playlist/api";

const TRACK_PAGE_SIZE = 1000;

function getHistoricalSongs(
  response: HistoricalDailyRecommendationDetailResponse,
): RawSongDetail[] {
  const songs = response.data?.dailySongs ?? response.data?.songs;
  return Array.isArray(songs) ? songs : [];
}

async function fetchPlaylistContent(
  { dailyDate, isDailyRecommendation, isRecommend, playlistId }: PlaylistContentRequest,
  signal?: AbortSignal,
): Promise<PlaylistContent> {
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
    getPlaylistAllTracks(
      { id: playlistId, limit: TRACK_PAGE_SIZE, requiresMusicSession: isRecommend },
      signal,
    ),
  ]);
  const rawDetail = detailResponse.data.playlist;
  if (!rawDetail) throw new Error("Playlist detail is missing.");
  let page = prunePlaylistTracks(trackResponse.data);
  const tracks = [...page];
  const trackCount = rawDetail.trackIds?.length ?? rawDetail.trackCount ?? 0;
  let offset = TRACK_PAGE_SIZE;
  // A full page can have a successor even when the playlist's count is stale.
  while (page.length === TRACK_PAGE_SIZE || (page.length > 0 && offset < trackCount)) {
    const next = await getPlaylistAllTracks(
      { id: playlistId, offset, limit: TRACK_PAGE_SIZE, requiresMusicSession: isRecommend },
      signal,
    );
    page = prunePlaylistTracks(next.data);
    tracks.push(...page);
    offset += TRACK_PAGE_SIZE;
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
    queryFn: ({ signal }) => fetchPlaylistContent(request, signal),
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
