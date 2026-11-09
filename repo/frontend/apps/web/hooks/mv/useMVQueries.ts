"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicMvDetail, MusicMvPage } from "@scopify/music-domain/mv";
import { type InfiniteData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/hooks/auth/useAuth";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { getArtistMVs } from "@/lib/providers/netease/api/artist";
import { getMVDetail, getMVDetailInfo } from "@/lib/providers/netease/api/mv";
import { getMusicProvider } from "@/lib/providers";
import { getRelatedMvs } from "@/lib/music/relatedMvs";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { MvPaginationParams } from "@/types/providers/netease/mvApi";
import type { MvQueryId, MvQueryOptions } from "@/types/mv/model";

/** One MV as the platform it belongs to reports it. */
export function useMvDetailQuery(mv: MusicResourceRef<"mv"> | null, options: MvQueryOptions = {}) {
  return useQuery({
    throwOnError: options.boundary ? throwQueryErrorWithoutData : false,
    enabled: (options.enabled ?? true) && mv !== null,
    queryKey: musicQueryKeys.mv.detailOf(mv?.provider ?? "netease", mv?.id ?? ""),
    queryFn: ({ signal }) => {
      if (!mv) throw new Error("MV is required.");
      return getMusicProvider(mv.provider).getMv(mv, signal);
    },
    meta: { persist: false, scope: "public" },
  });
}

/**
 * 播放链接会过期，每次挂载重新请求，离开后即回收。`maxHeight` 是想要的最高画质，
 * 平台返回不超过它的最好一档。
 */
export function useMvStreamQuery(
  mv: MusicResourceRef<"mv"> | null,
  maxHeight: number,
  options: MvQueryOptions = {},
) {
  const account = useActiveAccount();
  const accountId = account.profile?.accountId ?? "";
  return useQuery({
    enabled: (options.enabled ?? true) && mv !== null,
    queryKey: musicQueryKeys.mv.stream(
      mv?.provider ?? "netease",
      mv?.id ?? "",
      maxHeight,
      accountId,
    ),
    queryFn: ({ signal }) => {
      if (!mv) throw new Error("MV is required.");
      return getMusicProvider(mv.provider).getMvStream(mv, { maxHeight, signal });
    },
    staleTime: 0,
    gcTime: 0,
    meta: { persist: false, scope: "account" },
  });
}

/** MVs worth watching after this one, page by page, without the current MV and repeats. */
export function useRelatedMvsQuery(
  detail: MusicMvDetail | undefined,
  limit: number,
  enabled: boolean,
  useBoundary = false,
) {
  const provider = detail?.ref.provider ?? "netease";
  const query = useInfiniteQuery<
    MusicMvPage,
    Error,
    InfiniteData<MusicMvPage>,
    ReturnType<typeof musicQueryKeys.mv.related>,
    number
  >({
    enabled: enabled && detail !== undefined,
    throwOnError: useBoundary ? throwQueryErrorWithoutData : undefined,
    queryKey: musicQueryKeys.mv.related(provider, detail?.ref.id ?? "", limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) =>
      lastPage.hasMore ? lastOffset + limit : undefined,
    queryFn: ({ pageParam, signal }) => {
      if (!detail) throw new Error("MV is required.");
      return getMusicProvider(detail.ref.provider).getRelatedMvs(detail, {
        offset: pageParam,
        limit,
        signal,
      });
    },
  });
  const mvs = useMemo(
    () =>
      detail
        ? getRelatedMvs(query.data?.pages.flatMap((page) => page.mvs) ?? [], detail.ref.id)
        : [],
    [detail, query.data],
  );
  return { ...query, mvs };
}

/** NetEase only (`mv.interact`): whether the account saved the MV. */
export function useMvSubscribedQuery(mvid: MvQueryId, options: MvQueryOptions = {}) {
  const { accountId } = useAuth();
  const id = mvid ? String(mvid) : "";
  return useQuery({
    enabled: (options.enabled ?? true) && Boolean(id),
    queryKey: musicQueryKeys.mv.detail(id, accountId ?? ""),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("MV ID is required.");
      return Boolean((await getMVDetail(id, signal)).data.subed);
    },
    meta: { persist: false, scope: "account" },
  });
}

/** NetEase only (`mv.interact`): the like state and counts. */
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

/** The stream of a NetEase MV known only by its number (track bridges, hover previews). */
export function useNeteaseMvStreamQuery(mvId: number, maxHeight = 1080) {
  const mv = useMemo(
    () => (mvId > 0 ? ({ provider: "netease", kind: "mv", id: String(mvId) } as const) : null),
    [mvId],
  );
  return useMvStreamQuery(mv, maxHeight);
}
