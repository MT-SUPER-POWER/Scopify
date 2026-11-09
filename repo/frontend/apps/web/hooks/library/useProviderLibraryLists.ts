"use client";

import type { MusicListeningRankRange } from "@scopify/music-domain/library";
import { useQuery } from "@tanstack/react-query";

import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { providerQueryKey } from "@/lib/query/providerQueryKey";

/** The songs in the account's cloud drive, on a platform that lists them (`cloud`). */
export function useProviderCloudQuery() {
  const { account, provider } = useLibraryAccount();
  return useQuery({
    enabled: account !== null && provider.getCloudEntries !== undefined,
    meta: { scope: "account" },
    queryKey: providerQueryKey(provider.provider, "library", "cloud", account?.accountId ?? ""),
    queryFn: ({ signal }) => {
      if (!provider.getCloudEntries) throw new Error("The cloud drive is unsupported.");
      return provider.getCloudEntries({ signal });
    },
  });
}

/** The account's most played songs in a period, on a platform that ranks them (`library.rank`). */
export function useListeningRankQuery(range: MusicListeningRankRange, date?: string) {
  const { account, provider } = useLibraryAccount();
  return useQuery({
    enabled: account !== null && provider.getListeningRank !== undefined,
    meta: { scope: "account" },
    queryKey: providerQueryKey(
      provider.provider,
      "library",
      "rank",
      account?.accountId ?? "",
      range,
      date ?? "current",
    ),
    queryFn: ({ signal }) => {
      if (!provider.getListeningRank) throw new Error("The listening rank is unsupported.");
      return provider.getListeningRank(range, { signal, date });
    },
  });
}
