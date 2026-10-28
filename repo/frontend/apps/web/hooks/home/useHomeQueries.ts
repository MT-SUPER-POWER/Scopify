"use client";

import { useQuery } from "@tanstack/react-query";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";

import { getArtistAlbums, getFollowedArtists, getHotArtists } from "@/lib/api/artist";
import { getNewestAlbums, getUserAlbumSublist } from "@/lib/api/album";
import { getPersonalizedNewSongs } from "@/lib/api/music";
import {
  getPersonalizePlaylists,
  getPlaylistAllTracks,
  getRecommendedPlaylists,
} from "@/lib/api/playlist";
import { getToplistDetail } from "@/lib/api/toplist";
import { getRecentPlaylists, getUserDetail } from "@/lib/api/user";
import { getRecommendedVoiceLists } from "@/lib/api/voicelist";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import type { NeteaseAlbum } from "@/types/album/api";
import { prunePlaylistTracks } from "@/types/playlist/api";

export function usePersonalizedPlaylistsQuery(limit = 100, boundary = true) {
  return useQuery({
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getPersonalizePlaylists(limit)).data,
    queryKey: musicQueryKeys.home.personalizedPlaylists(limit),
  });
}

export function useRecommendedPlaylistsQuery(enabled: boolean, boundary = true) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getRecommendedPlaylists()).data,
    queryKey: musicQueryKeys.home.recommendedPlaylists(accountId),
  });
}

export function useRecommendedVoiceListsQuery(limit = 24) {
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getRecommendedVoiceLists(limit)).data,
    queryKey: musicQueryKeys.home.recommendedVoiceLists(limit),
  });
}

export function useHotArtistsQuery(limit = 50, boundary = true) {
  return useQuery({
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
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
    throwOnError: throwQueryErrorWithoutData,
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getPersonalizedNewSongs(limit)).data,
    queryKey: musicQueryKeys.home.newSongs(limit),
  });
}

export function useToplistDetailQuery() {
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getToplistDetail()).data,
    queryKey: musicQueryKeys.home.toplists(),
  });
}

export function useNewAlbumsQuery() {
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getNewestAlbums()).data,
    queryKey: musicQueryKeys.home.newAlbums(),
  });
}

export function useToplistTracksQuery(id: number) {
  return useQuery({
    enabled: Boolean(id),
    meta: { persist: true, scope: "public" },
    queryFn: async () => {
      const res = await getPlaylistAllTracks({ id, limit: 3, offset: 0 });
      return prunePlaylistTracks(res.data);
    },
    queryKey: musicQueryKeys.home.toplistTracks(id),
    staleTime: 1000 * 60 * 30,
  });
}

export function useRecentPlaylistsQuery(enabled: boolean, limit = 20) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getRecentPlaylists(limit)).data,
    queryKey: musicQueryKeys.home.recentPlaylists(limit, accountId),
  });
}

export function useFollowedArtistsQuery(enabled: boolean, limit = 30, boundary = true) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => {
      const response = await getFollowedArtists(limit);
      if (response.data?.data && useUserStore.getState().user?.userId === userId) {
        useUserStore.getState().setFollowedArtists(response.data.data);
      }
      return response.data;
    },
    queryKey: musicQueryKeys.home.followedArtists(limit, accountId),
  });
}

export function useFollowedArtistsAlbumsQuery(enabled: boolean) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => {
      const followedRes = await getFollowedArtists(10);
      const artists = followedRes.data?.data ?? [];
      if (artists.length === 0) {
        const subRes = await getUserAlbumSublist({ limit: 20 });
        return (subRes.data?.data ?? []).map((album) => ({
          id: album.id,
          name: album.name,
          picUrl: album.picUrl,
          publishTime: album.subTime,
          artist: { name: "" },
        }));
      }

      const albumPromises = artists.slice(0, 4).map(async (artist) => {
        const res = await getArtistAlbums(artist.id, 5);
        return (res.data.hotAlbums ?? []).map((al) => ({
          id: al.id,
          name: al.name,
          picUrl: al.picUrl,
          publishTime: al.publishTime,
          artist: { id: artist.id, name: artist.name },
        }));
      });
      const results = await Promise.allSettled(albumPromises);
      if (results.every((result) => result.status === "rejected")) {
        const failed = results.find((result) => result.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
      }
      const combined = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      const seen = new Set<number>();
      const uniqueAlbums: NeteaseAlbum[] = [];
      for (const al of combined) {
        if (!seen.has(al.id)) {
          seen.add(al.id);
          uniqueAlbums.push(al);
        }
      }
      return uniqueAlbums;
    },
    queryKey: musicQueryKeys.home.followedArtistAlbums(20, accountId),
  });
}
