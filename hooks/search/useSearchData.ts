"use client";

import { useCallback, useMemo } from "react";

import {
  useAlbumSearchQuery,
  useArtistSearchQuery,
  usePlaylistSearchQuery,
  useSongSearchQuery,
} from "@/hooks/search/useSearchQueries";
import { translate } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";
import type {
  SearchResultAlbum,
  SearchResultPlaylist,
  SearchArtistSource,
  SongSearchResource,
} from "@/types/api/search";
import type { Album, Artist, Category, Playlist, Song } from "@/types/search";

function isValidPicUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith("http");
}

function mapSearchArtist(source: SearchArtistSource | undefined): Artist {
  return {
    albumSize: source?.albumSize,
    alias: source?.alias,
    fansSize: source?.fansSize,
    id: source?.id ?? 0,
    img1v1Url: source?.img1v1Url,
    musicSize: source?.musicSize,
    name: source?.name ?? "",
    picUrl: isValidPicUrl(source?.picUrl) ? source.picUrl : null,
  };
}

function mapSearchAlbum(source: SearchResultAlbum, unknownAlbumName: string): Album {
  return {
    artist: mapSearchArtist(source.artist),
    blurPicUrl: source.blurPicUrl,
    id: source.id,
    name: source.name || unknownAlbumName,
    picUrl: source.picUrl,
    publishTime: source.publishTime ?? 0,
    size: source.size ?? 0,
  };
}

function mapSearchPlaylist(source: SearchResultPlaylist): Playlist {
  return {
    bookCount: source.bookCount,
    coverImgUrl: source.coverImgUrl ?? "",
    creator: source.creator,
    description: source.description ?? undefined,
    id: source.id,
    name: source.name,
    playCount: source.playCount ?? 0,
    trackCount: source.trackCount ?? 0,
  };
}

function mapResourceToSong(
  resource: SongSearchResource,
  unknownAlbumName: string,
  unknownSongName: string,
): Song | null {
  const song = resource.baseInfo?.simpleSongData;
  if (!song) return null;

  const artists = song.ar?.map(mapSearchArtist) ?? [];
  const albumPicUrl = isValidPicUrl(song.al?.picUrl)
    ? song.al.picUrl
    : isValidPicUrl(song.al?.blurPicUrl)
      ? song.al.blurPicUrl
      : "";

  return {
    album: {
      artist: artists[0] ?? mapSearchArtist(undefined),
      id: song.al?.id ?? 0,
      name: song.al?.name ?? unknownAlbumName,
      picUrl: albumPicUrl,
      publishTime: 0,
      size: 0,
    },
    alias: song.alia ?? song.alias ?? [],
    artists,
    duration: song.dt ?? 0,
    fee: song.fee,
    id: song.id,
    name: song.name ?? unknownSongName,
  };
}

export function useSearchData(keywords: string, activeCategory: Category) {
  const locale = useI18nStore((state) => state.locale);
  const keyword = keywords.trim();
  const isAll = activeCategory === "All";
  const loadSongs = isAll || activeCategory === "Songs";
  const loadAlbums = isAll || activeCategory === "Albums";
  const loadPlaylists = isAll || activeCategory === "Playlists";
  const loadArtists = isAll || activeCategory === "Artists";
  const songQuery = useSongSearchQuery(keyword, isAll ? 4 : 30, loadSongs);
  const albumQuery = useAlbumSearchQuery(keyword, isAll ? 6 : 20, loadAlbums);
  const playlistQuery = usePlaylistSearchQuery(keyword, isAll ? 6 : 20, loadPlaylists);
  const artistQuery = useArtistSearchQuery(keyword, isAll ? 6 : 20, loadArtists);
  const unknownAlbumName = translate(locale, "common.meta.unknownAlbum");
  const unknownSongName = translate(locale, "common.meta.unknownSong");

  const songs = useMemo(
    () =>
      loadSongs
        ? (songQuery.data?.data?.resources ?? [])
            .map((resource) => mapResourceToSong(resource, unknownAlbumName, unknownSongName))
            .filter((song): song is Song => song !== null)
        : [],
    [loadSongs, songQuery.data?.data?.resources, unknownAlbumName, unknownSongName],
  );
  const albums = useMemo(
    () =>
      loadAlbums
        ? (albumQuery.data?.result?.albums ?? []).map((album) =>
            mapSearchAlbum(album, unknownAlbumName),
          )
        : [],
    [albumQuery.data?.result?.albums, loadAlbums, unknownAlbumName],
  );
  const playlists = useMemo(
    () =>
      loadPlaylists ? (playlistQuery.data?.result?.playlists ?? []).map(mapSearchPlaylist) : [],
    [loadPlaylists, playlistQuery.data?.result?.playlists],
  );
  const artists = useMemo(
    () => (loadArtists ? (artistQuery.data?.result?.artists ?? []).map(mapSearchArtist) : []),
    [artistQuery.data?.result?.artists, loadArtists],
  );
  const loading =
    songQuery.isFetching ||
    albumQuery.isFetching ||
    playlistQuery.isFetching ||
    artistQuery.isFetching;
  const hasError =
    songQuery.isError || albumQuery.isError || playlistQuery.isError || artistQuery.isError;

  const refetch = useCallback(async () => {
    await Promise.all([
      ...(loadSongs ? [songQuery.refetch()] : []),
      ...(loadAlbums ? [albumQuery.refetch()] : []),
      ...(loadPlaylists ? [playlistQuery.refetch()] : []),
      ...(loadArtists ? [artistQuery.refetch()] : []),
    ]);
  }, [albumQuery, artistQuery, loadAlbums, loadArtists, loadPlaylists, loadSongs, playlistQuery, songQuery]);

  return { albums, artists, hasError, loading, playlists, refetch, songs };
}
