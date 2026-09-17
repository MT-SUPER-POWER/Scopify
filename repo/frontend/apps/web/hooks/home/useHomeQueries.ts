"use client";

import { useQuery } from "@tanstack/react-query";

import { getHotArtists } from "@/lib/api/artist";
import { getNewestAlbums } from "@/lib/api/album";
import { getPersonalizedNewSongs } from "@/lib/api/music";
import { getPersonalizePlaylists, getRecommendedPlaylists } from "@/lib/api/playlist";
import { getToplistDetail } from "@/lib/api/toplist";
import { getUserDetail } from "@/lib/api/user";
import { getRecommendedVoiceLists } from "@/lib/api/voicelist";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export function usePersonalizedPlaylistsQuery(limit = 100) {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getPersonalizePlaylists(limit)).data,
    queryKey: musicQueryKeys.home.personalizedPlaylists(limit),
  });
}

export function useRecommendedPlaylistsQuery(enabled: boolean) {
  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getRecommendedPlaylists()).data,
    queryKey: musicQueryKeys.home.recommendedPlaylists(),
  });
}

export function useRecommendedVoiceListsQuery(limit = 24) {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getRecommendedVoiceLists(limit)).data,
    queryKey: musicQueryKeys.home.recommendedVoiceLists(limit),
  });
}

export function useHotArtistsQuery(limit = 50) {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getHotArtists(limit)).data,
    queryKey: musicQueryKeys.home.hotArtists(limit),
  });
}

export function useHomeUserProfileQuery(userId: null | string) {
  return useQuery({
    enabled: userId !== null,
    meta: { scope: "account" },
    queryFn: async () => {
      if (!userId) throw new Error("A user ID is required to load the profile.");
      return (await getUserDetail(userId)).data;
    },
    queryKey: musicQueryKeys.home.userProfile(userId ?? ""),
  });
}

export function useNewSongsQuery(limit = 12) {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getPersonalizedNewSongs(limit)).data,
    queryKey: musicQueryKeys.home.newSongs(limit),
  });
}

export function useToplistDetailQuery() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getToplistDetail()).data,
    queryKey: musicQueryKeys.home.toplists(),
  });
}

export function useNewAlbumsQuery() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getNewestAlbums()).data,
    queryKey: musicQueryKeys.home.newAlbums(),
  });
}
