"use client";

import { type InfiniteData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  searchAlbums,
  searchArtists,
  searchComplex,
  searchPlaylists,
  searchSongs,
  searchVoices,
} from "@/lib/api/search";
import { searchVoiceLists } from "@/lib/api/voicelist";
import { getVoiceListSearchItems } from "@/lib/search/voiceListSearchAdapter";
import { getVoiceSearchItems, hasMoreVoiceSearchResults } from "@/lib/search/voiceSearchAdapter";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type {
  AlbumSearchResponse,
  ArtistSearchResponse,
  PlaylistSearchResponse,
  SongSearchResponse,
  VoiceSearchResponse,
} from "@/types/api/search";
import type { VoiceListSearchResponse } from "@/types/api/voicelist";

function isEnabled(keyword: string, enabled: boolean) {
  return enabled && keyword.length > 0;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function getSearchHasMore(response: unknown): boolean | undefined {
  const record = toRecord(response);
  const candidates = [record, toRecord(record?.data), toRecord(record?.result)];

  for (const candidate of candidates) {
    if (typeof candidate?.hasMore === "boolean") return candidate.hasMore;
    if (typeof candidate?.more === "boolean") return candidate.more;
  }

  return undefined;
}

function getNextSearchPageOffset<T>(
  lastPage: T,
  lastPageOffset: number,
  limit: number,
  getItems: (page: T) => readonly unknown[],
) {
  const itemCount = getItems(lastPage).length;
  const hasMore = getSearchHasMore(lastPage);
  if (itemCount === 0 || hasMore === false) return undefined;
  if (hasMore === undefined && itemCount < limit) return undefined;

  return lastPageOffset + itemCount;
}

export function useInfiniteSongSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    SongSearchResponse,
    Error,
    InfiniteData<SongSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.songs>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNextSearchPageOffset(
        lastPage,
        lastPageOffset,
        limit,
        (page) => page.data?.resources ?? [],
      ),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchSongs(keyword, limit, pageParam)).data,
    queryKey: musicQueryKeys.search.songs(keyword, limit),
  });
}

export function useInfiniteAlbumSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    AlbumSearchResponse,
    Error,
    InfiniteData<AlbumSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.albums>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNextSearchPageOffset(lastPage, lastPageOffset, limit, (page) => page.result?.albums ?? []),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchAlbums(keyword, limit, pageParam)).data,
    queryKey: musicQueryKeys.search.albums(keyword, limit),
  });
}

export function useInfinitePlaylistSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    PlaylistSearchResponse,
    Error,
    InfiniteData<PlaylistSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.playlists>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNextSearchPageOffset(
        lastPage,
        lastPageOffset,
        limit,
        (page) => page.result?.playlists ?? [],
      ),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchPlaylists(keyword, limit, pageParam)).data,
    queryKey: musicQueryKeys.search.playlists(keyword, limit),
  });
}

export function useInfiniteArtistSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    ArtistSearchResponse,
    Error,
    InfiniteData<ArtistSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.artists>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNextSearchPageOffset(
        lastPage,
        lastPageOffset,
        limit,
        (page) => page.result?.artists ?? [],
      ),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchArtists(keyword, limit, pageParam)).data,
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

export function useInfiniteVoiceListSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    VoiceListSearchResponse,
    Error,
    InfiniteData<VoiceListSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.voiceLists>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNextSearchPageOffset(lastPage, lastPageOffset, limit, getVoiceListSearchItems),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchVoiceLists(keyword, limit, pageParam)).data,
    queryKey: musicQueryKeys.search.voiceLists(keyword, limit),
  });
}

export function useInfiniteVoiceSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    VoiceSearchResponse,
    Error,
    InfiniteData<VoiceSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.voices>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) => {
      const hasMore = hasMoreVoiceSearchResults(lastPage);
      const itemCount = getVoiceSearchItems(lastPage).length;
      if (itemCount === 0 || hasMore === false) return undefined;
      if (hasMore === undefined && itemCount < limit) return undefined;
      return lastPageOffset + itemCount;
    },
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchVoices(keyword, limit, pageParam)).data,
    queryKey: musicQueryKeys.search.voices(keyword, limit),
  });
}
