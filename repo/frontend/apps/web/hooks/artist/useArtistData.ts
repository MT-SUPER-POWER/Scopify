"use client";

import { useCallback, useMemo } from "react";

import {
  useArtistAlbumsQuery,
  useArtistDetailQuery,
  useArtistFollowCountQuery,
  useArtistTopSongsQuery,
} from "@/hooks/artist/useArtistQueries";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail } from "@/types/api/music";

export function useArtistData(artistId: null | string) {
  const { t } = useI18n();
  const artistDetailQuery = useArtistDetailQuery(artistId);
  const followCountQuery = useArtistFollowCountQuery(artistId);
  const topSongsQuery = useArtistTopSongsQuery(artistId);
  const albumsQuery = useArtistAlbumsQuery(artistId);

  const artist = useMemo(() => {
    const rawArtist = artistDetailQuery.data?.data.artist;
    if (!rawArtist) return null;

    return {
      avatar: rawArtist.avatar,
      bio: rawArtist.briefDesc || t("artist.about.noBio"),
      headerImageUrl: rawArtist.cover,
      id: rawArtist.id,
      isVerified: true,
      listeners: followCountQuery.data?.data.fansCnt ?? 0,
      name: rawArtist.name,
    };
  }, [artistDetailQuery.data, followCountQuery.data, t]);

  const popularTracks = useMemo(
    () => (topSongsQuery.data?.songs ?? []).slice(0, 20).map(pruneSongDetail),
    [topSongsQuery.data],
  );

  const discography = useMemo(
    () =>
      (albumsQuery.data?.hotAlbums ?? []).slice(0, 10).map((album) => ({
        coverUrl: `${album.picUrl}?param=300y300`,
        id: album.id,
        releaseYear: new Date(album.publishTime).getFullYear(),
        title: album.name,
        type: album.type,
      })),
    [albumsQuery.data],
  );

  const refetch = useCallback(async () => {
    await Promise.all([
      artistDetailQuery.refetch(),
      followCountQuery.refetch(),
      topSongsQuery.refetch(),
      albumsQuery.refetch(),
    ]);
  }, [albumsQuery, artistDetailQuery, followCountQuery, topSongsQuery]);

  return {
    artist,
    discography,
    hotTracksQueue: popularTracks,
    isError:
      artistDetailQuery.isError ||
      followCountQuery.isError ||
      topSongsQuery.isError ||
      albumsQuery.isError,
    isLoading: artistDetailQuery.isLoading,
    isRefreshing:
      artistDetailQuery.isFetching ||
      followCountQuery.isFetching ||
      topSongsQuery.isFetching ||
      albumsQuery.isFetching,
    popularTracks,
    refetch,
  };
}
