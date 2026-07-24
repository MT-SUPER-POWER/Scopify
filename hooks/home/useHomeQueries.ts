"use client";

import { useQuery } from "@tanstack/react-query";

import { getUserAlbumSublist } from "@/lib/api/album";
import { getHotArtists } from "@/lib/api/artist";
import { getPersonalizePlaylists, getRecommendedPlaylists } from "@/lib/api/playlist";
import { getUserDetail } from "@/lib/api/user";
import { musicQueryKeys } from "@/lib/query/queryKeys";

function getMusicCookie() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("music_cookie") ?? undefined;
}

export function usePersonalizedPlaylistsQuery() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getPersonalizePlaylists()).data,
    queryKey: musicQueryKeys.home.personalizedPlaylists(),
  });
}

export function useRecommendedPlaylistsQuery(enabled: boolean) {
  const cookie = getMusicCookie();

  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getRecommendedPlaylists(cookie)).data,
    queryKey: musicQueryKeys.home.recommendedPlaylists(),
  });
}

export function useHotArtistsQuery() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getHotArtists()).data,
    queryKey: musicQueryKeys.home.hotArtists(),
  });
}

export function useCollectedAlbumsQuery(enabled: boolean) {
  const cookie = getMusicCookie();

  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getUserAlbumSublist({ cookie })).data,
    queryKey: musicQueryKeys.home.collectedAlbums(),
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
