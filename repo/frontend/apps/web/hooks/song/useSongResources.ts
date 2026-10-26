"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { getSheetPreview, getSongSheets, getSongWiki } from "@/lib/api/songResources";
import {
  normalizeSheetPreview,
  normalizeSongSheets,
  normalizeSongWiki,
} from "@/lib/music/songResources";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useAuth } from "@/hooks/auth/useAuth";

export function useSongWikiQuery(songId: number) {
  const { userId, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: musicQueryKeys.song.wiki(songId, isAuthenticated ? (userId ?? 0) : 0),
    queryFn: async ({ signal }) => normalizeSongWiki(await getSongWiki(songId, signal)),
    enabled: songId > 0,
    staleTime: 5 * 60_000,
    throwOnError: throwQueryErrorWithoutData,
  });
}
export function useSongSheetsQuery(songId: number) {
  return useQuery({
    queryKey: musicQueryKeys.song.sheets(songId),
    queryFn: async ({ signal }) => normalizeSongSheets(await getSongSheets(songId, signal)),
    enabled: songId > 0,
    staleTime: 5 * 60_000,
    throwOnError: throwQueryErrorWithoutData,
  });
}
/** 搜索结果页批量查询歌曲乐谱；与单曲查询共用 queryKey，弹窗打开时直接命中缓存。 */
export function useSongSheetsQueries(songIds: number[]) {
  return useQueries({
    queries: songIds.map((songId) => ({
      queryKey: musicQueryKeys.song.sheets(songId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        normalizeSongSheets(await getSongSheets(songId, signal)),
      enabled: songId > 0,
      staleTime: 5 * 60_000,
    })),
  });
}
export function useSheetPreviewQuery(sheetId: number) {
  const { userId, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: musicQueryKeys.song.sheetPreview(sheetId, isAuthenticated ? (userId ?? 0) : 0),
    queryFn: async ({ signal }) => normalizeSheetPreview(await getSheetPreview(sheetId, signal)),
    enabled: sheetId > 0 && isAuthenticated,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    throwOnError: throwQueryErrorWithoutData,
  });
}
