"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicProviderClient } from "@scopify/music-domain/provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { PlayerTrack } from "@/types/player/model";
import type { PlaylistContent, PlaylistContentRequest } from "@/types/playlist/model";

const TRACK_PAGE_SIZE = 1000;

/** Daily recommendations are the account's own list, not a playlist on any platform. */
async function fetchDailyRecommendations(
  provider: MusicProviderClient,
  dailyDate: null | string,
  signal: AbortSignal,
): Promise<PlaylistContent> {
  if (!provider.getDailyTracks) throw new Error("Daily recommendations are unsupported.");
  const tracks = await provider.getDailyTracks({
    ...(dailyDate ? { date: dailyDate } : {}),
    signal,
  });
  return { detail: null, tracks };
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
    provider.getPlaylistTracks(ref, { offset: 0, limit: TRACK_PAGE_SIZE }, options),
  ]);
  let page = firstPage.tracks;
  const tracks: PlayerTrack[] = [...page];
  let offset = TRACK_PAGE_SIZE;
  // A full page can have a successor even when the playlist's count is stale.
  while (page.length === TRACK_PAGE_SIZE || (page.length > 0 && offset < detail.trackCount)) {
    const next = await provider.getPlaylistTracks(ref, { offset, limit: TRACK_PAGE_SIZE }, options);
    page = next.tracks;
    tracks.push(...page);
    offset += TRACK_PAGE_SIZE;
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
        ? musicQueryKeys.playlist.daily(dailyCacheDate, provider.provider)
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
      if (isDailyRecommendation) return fetchDailyRecommendations(provider, dailyDate, signal);
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
