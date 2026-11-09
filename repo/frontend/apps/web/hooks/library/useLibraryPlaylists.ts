"use client";

import type { MusicLibraryPlaylist } from "@scopify/music-domain/library";
import { useQuery } from "@tanstack/react-query";

import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { musicQueryKeys } from "@/lib/query/queryKeys";

/**
 * The signed-in account's playlists on the active platform, read through its library source.
 * The key names the platform and the account, so a switch of either never shows the other's.
 */
export function useLibraryPlaylistsQuery(throwOnError = false) {
  const { account, provider } = useLibraryAccount();
  const enabled = account !== null && provider.capabilities.has("library.playlists");
  return useQuery({
    enabled,
    queryKey: musicQueryKeys.library.playlists(provider.provider, account?.accountId ?? ""),
    throwOnError: throwOnError ? throwQueryErrorWithoutData : false,
    meta: { persist: true, scope: "account" },
    queryFn: ({ signal }): Promise<MusicLibraryPlaylist[]> => {
      if (!account) throw new Error("Missing account.");
      return provider.getLibraryPlaylists(account, { signal });
    },
  });
}

/**
 * The account's liked-tracks playlist, or null when its library lists none. Only a failed read
 * is an error; an account without one is a successful, empty answer.
 */
export function useLikedPlaylistQuery() {
  const { account, provider } = useLibraryAccount();
  return useQuery({
    enabled: account !== null && provider.capabilities.has("library.playlists"),
    queryKey: musicQueryKeys.library.likedPlaylist(provider.provider, account?.accountId ?? ""),
    queryFn: async ({ signal }): Promise<MusicLibraryPlaylist | null> => {
      if (!account) throw new Error("Missing account.");
      const playlists = await provider.getLibraryPlaylists(account, { signal });
      return playlists.find((item) => item.isLikedList) ?? null;
    },
  });
}
