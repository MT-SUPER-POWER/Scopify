"use client";

import { useQuery } from "@tanstack/react-query";

import { getAritstDetail, getArtistAlbums, getArtistTopSongs, getFansCnt } from "@/lib/api/artist";
import { musicQueryKeys } from "@/lib/query/queryKeys";

function isEnabled(artistId: null | string) {
  return artistId !== null && artistId.length > 0;
}

export function useArtistDetailQuery(artistId: null | string) {
  return useQuery({
    enabled: isEnabled(artistId),
    meta: { persist: true, scope: "public" },
    queryFn: async () => {
      if (!artistId) throw new Error("Artist ID is required.");
      const response = await getAritstDetail(artistId);
      return response.data;
    },
    queryKey: musicQueryKeys.artist.detail(artistId ?? ""),
  });
}

export function useArtistFollowCountQuery(artistId: null | string) {
  return useQuery({
    enabled: isEnabled(artistId),
    meta: { persist: true, scope: "public" },
    queryFn: async () => {
      if (!artistId) throw new Error("Artist ID is required.");
      const response = await getFansCnt(artistId);
      return response.data;
    },
    queryKey: musicQueryKeys.artist.followCount(artistId ?? ""),
  });
}

export function useArtistTopSongsQuery(artistId: null | string) {
  return useQuery({
    enabled: isEnabled(artistId),
    meta: { persist: true, scope: "public" },
    queryFn: async () => {
      if (!artistId) throw new Error("Artist ID is required.");
      const response = await getArtistTopSongs(artistId);
      return response.data;
    },
    queryKey: musicQueryKeys.artist.topSongs(artistId ?? ""),
  });
}

export function useArtistAlbumsQuery(artistId: null | string) {
  return useQuery({
    enabled: isEnabled(artistId),
    meta: { persist: true, scope: "public" },
    queryFn: async () => {
      if (!artistId) throw new Error("Artist ID is required.");
      const response = await getArtistAlbums(artistId, 10);
      return response.data;
    },
    queryKey: musicQueryKeys.artist.albums(artistId ?? ""),
  });
}
