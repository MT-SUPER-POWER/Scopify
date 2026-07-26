"use client";

import { useCallback, useMemo } from "react";

import {
  useAlbumSearchQuery,
  useArtistSearchQuery,
  useComplexSearchQuery,
  usePlaylistSearchQuery,
  useSongSearchQuery,
} from "@/hooks/search/useSearchQueries";
import { translate } from "@/lib/i18n";
import { mapComplexSearchResponse } from "@/lib/search/complexSearchAdapter";
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
  const usesComplexSearch = isAll || activeCategory === "Podcasts" || activeCategory === "Voices";
  const loadSongs = isAll || activeCategory === "Songs";
  const loadAlbums = isAll || activeCategory === "Albums";
  const loadPlaylists = isAll || activeCategory === "Playlists";
  const loadArtists = isAll || activeCategory === "Artists";
  const complexQuery = useComplexSearchQuery(keyword, usesComplexSearch);
  const songQuery = useSongSearchQuery(keyword, 30, !usesComplexSearch && loadSongs);
  const albumQuery = useAlbumSearchQuery(keyword, 20, !usesComplexSearch && loadAlbums);
  const playlistQuery = usePlaylistSearchQuery(keyword, 20, !usesComplexSearch && loadPlaylists);
  const artistQuery = useArtistSearchQuery(keyword, 20, !usesComplexSearch && loadArtists);
  const unknownAlbumName = translate(locale, "common.meta.unknownAlbum");
  const unknownPodcastName = translate(locale, "search.podcast.unknown");
  const unknownSongName = translate(locale, "common.meta.unknownSong");
  const complexResults = useMemo(
    () =>
      mapComplexSearchResponse(
        complexQuery.data,
        unknownAlbumName,
        unknownSongName,
        unknownPodcastName,
      ),
    [complexQuery.data, unknownAlbumName, unknownPodcastName, unknownSongName],
  );

  const songs = useMemo(
    () =>
      isAll
        ? complexResults.songs
        : loadSongs
          ? (songQuery.data?.data?.resources ?? [])
              .map((resource) => mapResourceToSong(resource, unknownAlbumName, unknownSongName))
              .filter((song): song is Song => song !== null)
          : [],
    [
      complexResults.songs,
      isAll,
      loadSongs,
      songQuery.data?.data?.resources,
      unknownAlbumName,
      unknownSongName,
    ],
  );
  const albums = useMemo(
    () =>
      isAll
        ? complexResults.albums
        : loadAlbums
          ? (albumQuery.data?.result?.albums ?? []).map((album) =>
              mapSearchAlbum(album, unknownAlbumName),
            )
          : [],
    [albumQuery.data?.result?.albums, complexResults.albums, isAll, loadAlbums, unknownAlbumName],
  );
  const playlists = useMemo(
    () =>
      isAll
        ? complexResults.playlists
        : loadPlaylists
          ? (playlistQuery.data?.result?.playlists ?? []).map(mapSearchPlaylist)
          : [],
    [complexResults.playlists, isAll, loadPlaylists, playlistQuery.data?.result?.playlists],
  );
  const artists = useMemo(
    () =>
      isAll
        ? complexResults.artists
        : loadArtists
          ? (artistQuery.data?.result?.artists ?? []).map(mapSearchArtist)
          : [],
    [artistQuery.data?.result?.artists, complexResults.artists, isAll, loadArtists],
  );
  const podcasts = usesComplexSearch ? complexResults.podcasts : [];
  const voices = usesComplexSearch ? complexResults.voices : [];
  const bestMatch = isAll ? complexResults.bestMatch : null;
  const loading = usesComplexSearch
    ? complexQuery.isFetching
    : songQuery.isFetching ||
      albumQuery.isFetching ||
      playlistQuery.isFetching ||
      artistQuery.isFetching;
  const hasError = usesComplexSearch
    ? complexQuery.isError
    : songQuery.isError || albumQuery.isError || playlistQuery.isError || artistQuery.isError;

  const refetch = useCallback(async () => {
    if (usesComplexSearch) {
      await complexQuery.refetch();
      return;
    }

    await Promise.all([
      ...(loadSongs ? [songQuery.refetch()] : []),
      ...(loadAlbums ? [albumQuery.refetch()] : []),
      ...(loadPlaylists ? [playlistQuery.refetch()] : []),
      ...(loadArtists ? [artistQuery.refetch()] : []),
    ]);
  }, [
    albumQuery,
    artistQuery,
    complexQuery,
    usesComplexSearch,
    loadAlbums,
    loadArtists,
    loadPlaylists,
    loadSongs,
    playlistQuery,
    songQuery,
  ]);

  return {
    albums,
    artists,
    bestMatch,
    hasError,
    loading,
    playlists,
    podcasts,
    refetch,
    songs,
    voices,
  };
}
