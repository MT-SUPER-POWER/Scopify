"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getAritstDetail,
  getArtistAlbums,
  getArtistSongs,
  getArtistTopSongs,
  getFansCnt,
} from "@/lib/api/artist";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { pruneSongDetail } from "@/types/song/api";

const ARTIST_TRACKS_PAGE_SIZE = 30;

function isEnabled(artistId: null | string) {
  return artistId !== null && artistId.length > 0;
}

export function useArtistDetailQuery(artistId: null | string, throwOnError = false) {
  return useQuery({
    enabled: isEnabled(artistId),
    throwOnError: throwOnError ? throwQueryErrorWithoutData : false,
    meta: { persist: true, scope: "public" },
    queryFn: async () => {
      if (!artistId) throw new Error("Artist ID is required.");
      const response = await getAritstDetail(artistId);
      if (!response.data.data?.artist) throw new Error("Artist detail is missing.");
      return response.data;
    },
    queryKey: musicQueryKeys.artist.detail(artistId ?? ""),
  });
}

export function useArtistTracksQuery(artistId: string) {
  return useInfiniteQuery({
    queryKey: musicQueryKeys.artist.tracks(artistId),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await getArtistSongs(artistId, pageParam, ARTIST_TRACKS_PAGE_SIZE, signal);
      if (!Array.isArray(data.songs)) throw new Error("Artist tracks are missing.");
      const tracks = data.songs.map(pruneSongDetail);
      return {
        tracks,
        nextOffset: data.more && tracks.length > 0 ? pageParam + tracks.length : null,
      };
    },
    getNextPageParam: (page) => page.nextOffset ?? undefined,
    throwOnError: (error: Error, query) => throwQueryErrorWithoutData(error, query),
  });
}

export function useArtistFollowCountQuery(artistId: null | string) {
  return useQuery({
    enabled: isEnabled(artistId),
    meta: { persist: false, scope: "account" },
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

export {
  useFansGroupDetailQuery,
  useArtistFansGroupStatus,
} from "@/hooks/fansGroup/useFansGroupQueries";
