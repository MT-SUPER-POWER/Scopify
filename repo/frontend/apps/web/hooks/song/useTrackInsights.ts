"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import { useQuery } from "@tanstack/react-query";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { providerQueryKey } from "@/lib/query/providerQueryKey";

/** How many accounts liked a track, on a platform that counts them. */
export function useTrackLikeCount(track: MusicResourceRef<"track"> | null) {
  const provider = useActiveProvider();
  return useQuery({
    enabled:
      track !== null && track.provider === provider.provider && Boolean(provider.getTrackLikeCount),
    meta: { persist: false, scope: "public" },
    queryKey: providerQueryKey(provider.provider, "track", "like-count", track?.id ?? ""),
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: ({ signal }) => {
      if (!track || !provider.getTrackLikeCount) throw new Error("Like counts are unsupported.");
      return provider.getTrackLikeCount(track, signal);
    },
  });
}

/** The tags a platform puts on a track. */
export function useTrackLabels(track: MusicResourceRef<"track"> | null) {
  const provider = useActiveProvider();
  return useQuery({
    enabled:
      track !== null && track.provider === provider.provider && Boolean(provider.getTrackLabels),
    meta: { persist: false, scope: "public" },
    queryKey: providerQueryKey(provider.provider, "track", "labels", track?.id ?? ""),
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: ({ signal }) => {
      if (!track || !provider.getTrackLabels) throw new Error("Track labels are unsupported.");
      return provider.getTrackLabels(track, signal);
    },
  });
}
