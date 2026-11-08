"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicProviderClient } from "@scopify/music-domain/provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { getHistoricalDailyRecommendationDetail } from "@/lib/providers/netease/api/playlist";
import { getRecommendedSongs } from "@/lib/providers/netease/api/track";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { PlayerTrack } from "@/types/player/model";
import type { HistoricalDailyRecommendationDetailResponse } from "@/types/playlist/api";
import type { PlaylistContent, PlaylistContentRequest } from "@/types/playlist/model";
import { pruneSongDetail, type RawSongDetail } from "@/types/song/api";

/** Tracks asked for in the first request; a longer playlist reads the rest in one more. */
const FIRST_PAGE_SIZE = 1000;

function getHistoricalSongs(
  response: HistoricalDailyRecommendationDetailResponse,
): RawSongDetail[] {
  const songs = response.data?.dailySongs ?? response.data?.songs;
  return Array.isArray(songs) ? songs : [];
}

/** Daily recommendations are NetEase's own list, not a playlist on any platform. */
async function fetchDailyRecommendations(dailyDate: null | string): Promise<PlaylistContent> {
  const dailySongs: RawSongDetail[] = dailyDate
    ? getHistoricalSongs((await getHistoricalDailyRecommendationDetail(dailyDate)).data)
    : ((await getRecommendedSongs()).data?.data?.dailySongs ?? []);
  return {
    detail: null,
    tracks: dailySongs.map((song) => adaptNeteaseTrack(pruneSongDetail(song))),
  };
}

async function fetchPlaylist(
  provider: MusicProviderClient,
  playlistId: string,
  personal: boolean,
  signal: AbortSignal,
): Promise<PlaylistContent> {
  const ref: MusicResourceRef<"playlist"> = {
    provider: provider.provider,
    kind: "playlist",
    id: playlistId,
  };
  const options = { personal, signal };
  const [detail, firstPage] = await Promise.all([
    provider.getPlaylist(ref, options),
    provider.getPlaylistTracks(ref, { offset: 0, limit: FIRST_PAGE_SIZE }, options),
  ]);
  const tracks: PlayerTrack[] = [...firstPage.tracks];
  if (detail.trackCount > FIRST_PAGE_SIZE) {
    const remainder = await provider.getPlaylistTracks(
      ref,
      { offset: FIRST_PAGE_SIZE, limit: detail.trackCount - FIRST_PAGE_SIZE },
      options,
    );
    tracks.push(...remainder.tracks);
  }
  return { detail, tracks };
}

export function usePlaylistContentQuery(request: PlaylistContentRequest) {
  const queryClient = useQueryClient();
  const provider = useActiveProvider();
  const { dailyCacheDate, dailyDate, isDailyRecommendation, isRecommend, playlistId } = request;
  const queryKey = useMemo(
    () =>
      isDailyRecommendation
        ? musicQueryKeys.playlist.daily(dailyCacheDate)
        : musicQueryKeys.playlist.content(provider.provider, playlistId ?? "", isRecommend),
    [dailyCacheDate, isDailyRecommendation, isRecommend, playlistId, provider.provider],
  );
  const query = useQuery({
    enabled: isDailyRecommendation || Boolean(playlistId),
    meta: {
      persist: true,
      scope: "account",
    },
    queryFn: ({ signal }) => {
      if (isDailyRecommendation) return fetchDailyRecommendations(dailyDate);
      if (!playlistId) throw new Error("Playlist ID is required.");
      return fetchPlaylist(provider, playlistId, isRecommend, signal);
    },
    queryKey,
  });

  const setTracks = useCallback(
    (tracks: PlayerTrack[]) => {
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
