"use client";

import { useQuery } from "@tanstack/react-query";

import {
  searchAlbums,
  searchArtists,
  searchComplex,
  searchPlaylists,
  searchSongs,
} from "@/lib/api/search";
import { musicQueryKeys } from "@/lib/query/queryKeys";

function isEnabled(keyword: string, enabled: boolean) {
  return enabled && keyword.length > 0;
}

export function useSongSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useQuery({
    enabled: isEnabled(keyword, enabled),
    queryFn: async () => (await searchSongs(keyword, limit)).data,
    queryKey: musicQueryKeys.search.songs(keyword, limit),
  });
}

export function useAlbumSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useQuery({
    enabled: isEnabled(keyword, enabled),
    queryFn: async () => (await searchAlbums(keyword, limit)).data,
    queryKey: musicQueryKeys.search.albums(keyword, limit),
  });
}

export function usePlaylistSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useQuery({
    enabled: isEnabled(keyword, enabled),
    queryFn: async () => (await searchPlaylists(keyword, limit)).data,
    queryKey: musicQueryKeys.search.playlists(keyword, limit),
  });
}

export function useArtistSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useQuery({
    enabled: isEnabled(keyword, enabled),
    queryFn: async () => (await searchArtists(keyword, limit)).data,
    queryKey: musicQueryKeys.search.artists(keyword, limit),
  });
}

export function useComplexSearchQuery(keyword: string, enabled: boolean) {
  return useQuery({
    enabled: isEnabled(keyword, enabled),
    queryFn: async () => (await searchComplex(keyword)).data,
    queryKey: musicQueryKeys.search.complex(keyword),
  });
}
