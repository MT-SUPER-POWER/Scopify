"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { musicQueryKeys } from "@/lib/query/queryKeys";

/** Discography entries the artist page shows. */
export const ARTIST_ALBUMS_LIMIT = 10;

function isEnabled(artistId: null | string): artistId is string {
  return artistId !== null && artistId.length > 0;
}

/** The artist on the active platform, or null while the page has no artist ID. */
function useArtistRef(artistId: null | string): MusicResourceRef<"artist"> | null {
  const { provider } = useActiveProvider();
  return useMemo(
    () => (isEnabled(artistId) ? { provider, kind: "artist", id: artistId } : null),
    [artistId, provider],
  );
}

export function useArtistDetailQuery(artistId: null | string) {
  const provider = useActiveProvider();
  const artist = useArtistRef(artistId);
  return useQuery({
    enabled: artist !== null,
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!artist) throw new Error("Artist ID is required.");
      return provider.getArtist(artist, signal);
    },
    queryKey: musicQueryKeys.artist.detail(provider.provider, artistId ?? ""),
  });
}

export function useArtistTopTracksQuery(artistId: null | string) {
  const provider = useActiveProvider();
  const artist = useArtistRef(artistId);
  return useQuery({
    enabled: artist !== null,
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!artist) throw new Error("Artist ID is required.");
      return provider.getArtistTopTracks(artist, signal);
    },
    queryKey: musicQueryKeys.artist.topTracks(provider.provider, artistId ?? ""),
  });
}

export function useArtistAlbumsQuery(artistId: null | string) {
  const provider = useActiveProvider();
  const artist = useArtistRef(artistId);
  return useQuery({
    enabled: artist !== null,
    meta: { persist: true, scope: "public" },
    queryFn: async ({ signal }) => {
      if (!artist) throw new Error("Artist ID is required.");
      const page = await provider.getArtistAlbums(
        artist,
        { offset: 0, limit: ARTIST_ALBUMS_LIMIT },
        signal,
      );
      return page.albums;
    },
    queryKey: musicQueryKeys.artist.albums(provider.provider, artistId ?? "", ARTIST_ALBUMS_LIMIT),
  });
}

/** Whether the signed-in account follows the artist, where the platform has following. */
export function useArtistFollowStateQuery(artistId: null | string) {
  const { account, provider } = useLibraryAccount();
  const artist = useArtistRef(artistId);
  const canFollow = provider.capabilities.has("artist.follow");
  return useQuery({
    enabled: account !== null && artist !== null && canFollow,
    meta: { persist: false, scope: "account" },
    queryFn: ({ signal }) => {
      if (!artist || !provider.getArtistFollowState) {
        throw new Error("Following artists is not supported.");
      }
      return provider.getArtistFollowState(artist, signal);
    },
    queryKey: musicQueryKeys.artist.followState(
      provider.provider,
      account?.accountId ?? "",
      artistId ?? "",
    ),
  });
}

export {
  useFansGroupDetailQuery,
  useArtistFansGroupStatus,
} from "@/hooks/fansGroup/useFansGroupQueries";
