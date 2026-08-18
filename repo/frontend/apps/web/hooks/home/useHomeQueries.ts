"use client";

import { useQuery } from "@tanstack/react-query";

import { getHotArtists } from "@/lib/api/artist";
import { getRecommendedVoiceLists } from "@/lib/api/voicelist";
import { getPersonalizePlaylists, getRecommendedPlaylists } from "@/lib/api/playlist";
import { getUserDetail } from "@/lib/api/user";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";

function getMusicCookie() {
  return getMusicSessionCredential();
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

export function useRecommendedVoiceListsQuery() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getRecommendedVoiceLists()).data,
    queryKey: musicQueryKeys.home.recommendedVoiceLists(),
  });
}

export function useHotArtistsQuery() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getHotArtists()).data,
    queryKey: musicQueryKeys.home.hotArtists(),
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
