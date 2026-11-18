"use client";

import type { MusicAccountRef, MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicProviderClient } from "@scopify/music-domain/provider";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import { useUserStore } from "@/store/module/user";

/**
 * The IDs of the tracks the account liked on the active platform. NetEase keeps mirroring them
 * into the user store, which its search, artist and queue entry points still read.
 */
export function likedTrackIdsOptions(
  provider: MusicProviderClient,
  account: MusicAccountRef | null,
) {
  return queryOptions({
    queryKey: musicQueryKeys.library.likedTrackIds(provider.provider, account?.accountId ?? ""),
    meta: { scope: "account" },
    queryFn: async ({ signal }): Promise<string[]> => {
      if (!account) throw new Error("Missing account.");
      const credential = provider.provider === "netease" ? getMusicSessionCredential() : null;
      const ids = await provider.getLikedTrackIds(account, { signal });
      if (
        credential &&
        getMusicSessionCredential() === credential &&
        !signal.aborted &&
        String(useUserStore.getState().user?.userId) === account.accountId
      ) {
        useUserStore.getState().setLikeListIDs(ids.map(Number));
      }
      return ids;
    },
  });
}

export function useLikedTrackIdsQuery() {
  const { account, provider } = useLibraryAccount();
  return useQuery({
    ...likedTrackIdsOptions(provider, account),
    enabled: account !== null && provider.capabilities.has("track.like"),
  });
}

/**
 * Whether a track is liked by the active account. A track of another platform, a signed-out
 * session and a list that failed to load all answer "not liked" without ever showing another
 * account's likes; the answer is never a default made up for a failure.
 */
export function useTrackLikes() {
  const { account, provider } = useLibraryAccount();
  const query = useLikedTrackIdsQuery();
  // NetEase answers from the store its optimistic updates and older pages share.
  const neteaseIds = useUserStore((state) => state.likeListIDs);
  const likedIds = useMemo<ReadonlySet<string>>(() => {
    if (!account) return new Set();
    if (provider.provider === "netease") {
      return new Set(Array.isArray(neteaseIds) ? neteaseIds.map(String) : []);
    }
    return new Set(query.data ?? []);
  }, [account, neteaseIds, provider.provider, query.data]);
  const isLiked = useCallback(
    (track: MusicResourceRef<"track">) =>
      track.provider === provider.provider && likedIds.has(track.id),
    [likedIds, provider.provider],
  );
  return { isLiked, likedIds };
}
