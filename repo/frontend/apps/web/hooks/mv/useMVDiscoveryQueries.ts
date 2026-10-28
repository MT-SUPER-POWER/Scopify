"use client";

import { useQuery } from "@tanstack/react-query";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  getAllMVs,
  getExclusiveMVs,
  getLatestMVs,
  getRecommendedMVs,
  getSimilarMVs,
  getTopMVs,
} from "@/lib/api/mv";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { MvFirstParams, MvListParams, MvPaginationParams, MvTopParams } from "@/types/mv/api";
import type { MvQueryId, MvQueryOptions } from "@/types/mv/model";

export function useAllMVsQuery(params: MvListParams = {}, options: MvQueryOptions = {}) {
  return useQuery({
    enabled: options.enabled,
    queryKey: musicQueryKeys.mv.list(params),
    queryFn: async ({ signal }) => (await getAllMVs(params, signal)).data,
    meta: { persist: true, scope: "public" },
  });
}

export function useLatestMVsQuery(params: MvFirstParams = {}, options: MvQueryOptions = {}) {
  return useQuery({
    enabled: options.enabled,
    queryKey: musicQueryKeys.mv.latest(params),
    queryFn: async ({ signal }) => (await getLatestMVs(params, signal)).data,
    meta: { persist: true, scope: "public" },
  });
}

export function useExclusiveMVsQuery(
  params: MvPaginationParams = {},
  options: MvQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled,
    queryKey: musicQueryKeys.mv.exclusive(params),
    queryFn: async ({ signal }) => (await getExclusiveMVs(params, signal)).data,
    meta: { persist: true, scope: "public" },
  });
}

export function useRecommendedMVsQuery(options: MvQueryOptions = {}) {
  const { accountId } = useAuth();
  return useQuery({
    enabled: options.enabled,
    queryKey: musicQueryKeys.mv.recommended(accountId ?? ""),
    queryFn: async ({ signal }) => (await getRecommendedMVs(signal)).data,
    meta: { persist: false, scope: "account" },
  });
}

export function useTopMVsQuery(params: MvTopParams = {}, options: MvQueryOptions = {}) {
  return useQuery({
    enabled: options.enabled,
    queryKey: musicQueryKeys.mv.top(params),
    queryFn: async ({ signal }) => (await getTopMVs(params, signal)).data,
    meta: { persist: true, scope: "public" },
  });
}

export function useSimilarMVsQuery(mvid: MvQueryId, options: MvQueryOptions = {}) {
  const id = mvid ? String(mvid) : "";
  return useQuery({
    throwOnError: options.boundary ? throwQueryErrorWithoutData : false,
    enabled: (options.enabled ?? true) && Boolean(id),
    queryKey: musicQueryKeys.mv.similar(id),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("MV ID is required.");
      return (await getSimilarMVs(id, signal)).data;
    },
    meta: { persist: true, scope: "public" },
  });
}
