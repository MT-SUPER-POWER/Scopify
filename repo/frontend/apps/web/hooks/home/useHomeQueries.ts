"use client";

import { useQuery } from "@tanstack/react-query";

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
import type { NeteaseAlbum } from "@/types/api/album";
import { prunePlaylistTracks } from "@/types/api/playlist";

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
  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getRecentPlaylists(limit)).data,
    queryKey: musicQueryKeys.home.recentPlaylists(limit),
  });
}

export function useFollowedArtistsQuery(enabled: boolean, limit = 30) {
  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getFollowedArtists(limit)).data,
    queryKey: musicQueryKeys.home.followedArtists(limit),
  });
}

export function useFollowedArtistsAlbumsQuery(enabled: boolean) {
  return useQuery({
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
        try {
          const res = await getArtistAlbums(artist.id, 5);
          return (res.data.hotAlbums ?? []).map((al) => ({
            id: al.id,
            name: al.name,
            picUrl: al.picUrl,
            publishTime: al.publishTime,
            artist: { id: artist.id, name: artist.name },
          }));
        } catch {
          return [];
        }
      });

      const nested = await Promise.all(albumPromises);
      const combined = nested.flat();
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
    queryKey: musicQueryKeys.home.followedArtistAlbums(20),
  });
}
