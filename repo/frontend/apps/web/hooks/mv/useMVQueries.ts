"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth/useAuth";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { getArtistMVs } from "@/lib/api/artist";
import { getMVDetail, getMVDetailInfo, getMVUrl } from "@/lib/api/mv";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { MvPaginationParams } from "@/types/mv/api";
import type { MvQueryId, MvQueryOptions } from "@/types/mv/model";

export function useMVDetailQuery(mvid: MvQueryId, options: MvQueryOptions = {}) {
  const { accountId } = useAuth();
  const id = mvid ? String(mvid) : "";
  return useQuery({
    throwOnError: options.boundary ? throwQueryErrorWithoutData : false,
    enabled: (options.enabled ?? true) && Boolean(id),
    queryKey: musicQueryKeys.mv.detail(id, accountId ?? ""),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("MV ID is required.");
      return (await getMVDetail(id, signal)).data;
    },
    meta: { persist: false, scope: "account" },
  });
}

export function useMVDetailInfoQuery(mvid: MvQueryId, options: MvQueryOptions = {}) {
  const { accountId } = useAuth();
  const id = mvid ? String(mvid) : "";
  return useQuery({
    enabled: (options.enabled ?? true) && Boolean(id),
    queryKey: musicQueryKeys.mv.info(id, accountId ?? ""),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("MV ID is required.");
      return (await getMVDetailInfo(id, signal)).data;
    },
    meta: { persist: false, scope: "account" },
  });
}

/** 播放链接会过期，每次挂载重新请求，离开后即回收。 */
export function useMVUrlQuery(mvid: MvQueryId, r = 1080, options: MvQueryOptions = {}) {
  const { accountId } = useAuth();
  const id = mvid ? String(mvid) : "";
  return useQuery({
    enabled: (options.enabled ?? true) && Boolean(id),
    queryKey: musicQueryKeys.mv.url(id, r, accountId ?? ""),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("MV ID is required.");
      return (await getMVUrl(id, r, signal)).data;
    },
    staleTime: 0,
    gcTime: 0,
    meta: { persist: false, scope: "account" },
  });
}

export function useArtistMVsQuery(
  artistId: MvQueryId,
  params: MvPaginationParams = {},
  options: MvQueryOptions = {},
) {
  const id = artistId ? String(artistId) : "";
  return useQuery({
    enabled: (options.enabled ?? true) && Boolean(id),
    queryKey: musicQueryKeys.mv.artist(id, params),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Artist ID is required.");
      return (await getArtistMVs(id, params.limit ?? 30, params.offset ?? 0, signal)).data;
    },
    meta: { persist: true, scope: "public" },
  });
}
