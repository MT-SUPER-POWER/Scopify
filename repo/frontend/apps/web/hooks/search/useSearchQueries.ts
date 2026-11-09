"use client";

import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";

import type {
  MusicSearchKind,
  MusicSearchPage,
  MusicSearchResultMap,
} from "@scopify/music-domain/search";
import { type InfiniteData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import {
  searchLyrics,
  searchMVs,
  searchSongs,
  searchVoices,
} from "@/lib/providers/netease/api/search";
import { getNeteaseSearchNextOffset } from "@/lib/providers/netease/search";
import { searchVoiceLists } from "@/lib/providers/netease/api/voicelist";
import { getVoiceListSearchItems } from "@/lib/search/voiceListSearchAdapter";
import { getVoiceSearchItems, hasMoreVoiceSearchResults } from "@/lib/search/voiceSearchAdapter";
import { providerQueryKey } from "@/lib/query/providerQueryKey";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type {
  LyricSearchResponse,
  MvSearchResponse,
  SongSearchResponse,
  VoiceSearchResponse,
} from "@/types/providers/netease/searchApi";
import type { SearchOverview } from "@/types/search/model";
import type { VoiceListSearchResponse } from "@/types/voice/api";

function isEnabled(keyword: string, enabled: boolean) {
  return enabled && keyword.length > 0;
}

/**
 * Results of one kind, page by page, from the active platform. The list is as long as the
 * pages loaded so far; the platform says where the next page starts.
 */
export function useInfiniteSearchQuery<Kind extends MusicSearchKind>(
  kind: Kind,
  keyword: string,
  limit: number,
  enabled: boolean,
) {
  const provider = useActiveProvider();
  return useInfiniteQuery<
    MusicSearchPage<MusicSearchResultMap[Kind]>,
    Error,
    InfiniteData<MusicSearchPage<MusicSearchResultMap[Kind]>>,
    ReturnType<typeof musicQueryKeys.search.results>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      provider.search({ keyword, kind, limit, offset: pageParam }, signal),
    queryKey: musicQueryKeys.search.results(provider.provider, kind, keyword, limit),
  });
}

/** The first results of every kind from one request; only for platforms with the overview. */
export function useSearchOverviewQuery(keyword: string, enabled: boolean) {
  const provider = useActiveProvider();
  return useQuery<SearchOverview>({
    enabled: isEnabled(keyword, enabled),
    queryFn: ({ signal }) => {
      if (!provider.searchOverview) throw new Error("This platform has no search overview.");
      return provider.searchOverview(keyword, signal);
    },
    queryKey: musicQueryKeys.search.overview(provider.provider, keyword),
  });
}

/** The platform's direct hit for a keyword, for platforms whose lists are searched by kind. */
export function useSearchBestMatchQuery(keyword: string, enabled: boolean) {
  const provider = useActiveProvider();
  return useQuery({
    enabled: isEnabled(keyword, enabled && Boolean(provider.getSearchBestMatch)),
    queryFn: ({ signal }) => {
      if (!provider.getSearchBestMatch) throw new Error("This platform has no direct hit.");
      return provider.getSearchBestMatch(keyword, signal);
    },
    queryKey: providerQueryKey(provider.provider, "search", "best-match", keyword),
    retry: false,
  });
}

/** Songs as NetEase answers them, for the sheet search that reads NetEase's own fields. */
export function useInfiniteSheetSongSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    SongSearchResponse,
    Error,
    InfiniteData<SongSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.sheetSongs>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    throwOnError: throwQueryErrorWithoutData,
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNeteaseSearchNextOffset(
        lastPage,
        lastPageOffset,
        limit,
        (lastPage.data?.resources ?? []).length,
      ) ?? undefined,
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) =>
      (await searchSongs(keyword, limit, pageParam, signal)).data,
    queryKey: musicQueryKeys.search.sheetSongs(keyword, limit),
  });
}

export function useInfiniteLyricSearchQuery(keyword: string, limit: number, enabled: boolean) {
  return useInfiniteQuery<
    LyricSearchResponse,
    Error,
    InfiniteData<LyricSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.lyrics>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    getNextPageParam: (lastPage, _pages, lastPageOffset) =>
      getNeteaseSearchNextOffset(
        lastPage,
        lastPageOffset,
        limit,
        (lastPage.data?.resources ?? []).length,
      ) ?? undefined,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await searchLyrics(keyword, limit, pageParam)).data,
    queryKey: musicQueryKeys.search.lyrics(keyword, limit),
  });
}

export function useInfiniteMvSearchQuery(
  keyword: string,
  limit: number,
  enabled: boolean,
  useBoundary = false,
) {
  return useInfiniteQuery<
    MvSearchResponse,
    Error,
    InfiniteData<MvSearchResponse>,
    ReturnType<typeof musicQueryKeys.search.mvs>,
    number
  >({
    enabled: isEnabled(keyword, enabled),
    throwOnError: useBoundary ? throwQueryErrorWithoutData : undefined,
    getNextPageParam: (lastPage, pages, lastPageOffset) => {
      const nextOffset = getNeteaseSearchNextOffset(
        lastPage,
        lastPageOffset,
        limit,
        (lastPage.result?.mvs ?? []).length,
      );
      // 接口不返回 hasMore，用总数判断是否已经取完
      const total = pages[0]?.result?.mvCount;
      return nextOffset !== null && (total === undefined || nextOffset < total)
        ? nextOffset
        : undefined;
    },
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) =>
      (await searchMVs(keyword, limit, pageParam, signal)).data,
    queryKey: musicQueryKeys.search.mvs(keyword, limit),
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
      getNeteaseSearchNextOffset(
        lastPage,
        lastPageOffset,
        limit,
        getVoiceListSearchItems(lastPage).length,
      ) ?? undefined,
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
