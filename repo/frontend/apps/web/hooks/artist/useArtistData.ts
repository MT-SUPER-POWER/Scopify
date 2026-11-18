"use client";

import { useCallback, useMemo } from "react";

import {
  useArtistAlbumsQuery,
  useArtistDetailQuery,
  useArtistTopTracksQuery,
} from "@/hooks/artist/useArtistQueries";
import { useTranslation } from "react-i18next";

import type { ArtistInfo, DiscographyAlbum } from "@/types/artist/model";
import type { PlayerTrack } from "@/types/player/model";

const NO_TRACKS: PlayerTrack[] = [];

export function useArtistData(artistId: null | string) {
  const { t } = useTranslation();
  const artistDetailQuery = useArtistDetailQuery(artistId);
  const topTracksQuery = useArtistTopTracksQuery(artistId);
  const albumsQuery = useArtistAlbumsQuery(artistId);

  const artist = useMemo<ArtistInfo | null>(() => {
    const detail = artistDetailQuery.data;
    if (!detail) return null;

    return {
      avatar: detail.avatarUrl ?? "",
      bio: detail.description || t("artist.about.noBio"),
      headerImageUrl: detail.coverUrl ?? detail.avatarUrl ?? "",
      id: detail.ref.id,
      isVerified: detail.verified,
      listeners: detail.followerCount,
      name: detail.name,
    };
  }, [artistDetailQuery.data, t]);

  const popularTracks = topTracksQuery.data ?? NO_TRACKS;

  const discography = useMemo<DiscographyAlbum[]>(
    () =>
      (albumsQuery.data ?? []).map((album) => ({
        coverUrl: album.coverUrl,
        ref: album.ref,
        releaseYear: album.publishedAt === null ? null : new Date(album.publishedAt).getFullYear(),
        title: album.title,
        type: album.releaseType,
      })),
    [albumsQuery.data],
  );

  const refetch = useCallback(async () => {
    await Promise.all([
      artistDetailQuery.refetch(),
      topTracksQuery.refetch(),
      albumsQuery.refetch(),
    ]);
  }, [albumsQuery, artistDetailQuery, topTracksQuery]);

  return {
    artist,
    discography,
    isError: artistDetailQuery.isError || topTracksQuery.isError || albumsQuery.isError,
    isLoading: artistDetailQuery.isLoading,
    isPopularTracksLoading: topTracksQuery.isLoading,
    isRefreshing:
      artistDetailQuery.isFetching || topTracksQuery.isFetching || albumsQuery.isFetching,
    popularTracks,
    refetch,
  };
}
