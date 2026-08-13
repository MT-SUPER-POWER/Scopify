"use client";

import { useCallback, useMemo } from "react";

import {
  useComplexSearchQuery,
  useInfiniteAlbumSearchQuery,
  useInfiniteArtistSearchQuery,
  useInfinitePlaylistSearchQuery,
  useInfiniteSongSearchQuery,
  useInfiniteVoiceListSearchQuery,
  useInfiniteVoiceSearchQuery,
} from "@/hooks/search/useSearchQueries";
import { translate } from "@/lib/i18n";
import { mapComplexSearchResponse } from "@/lib/search/complexSearchAdapter";
import {
  getVoiceListSearchItems,
  mapVoiceListSearchItem,
} from "@/lib/search/voiceListSearchAdapter";
import { getVoiceSearchItems, mapVoiceSearchItem } from "@/lib/search/voiceSearchAdapter";
import { useI18nStore } from "@/store/module/i18n";
import type {
  SearchResultAlbum,
  SearchResultPlaylist,
  SearchArtistSource,
  SongSearchResource,
} from "@/types/api/search";
import type { Album, Artist, Category, Playlist, Podcast, Song } from "@/types/search";

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
    mvid: song.mvid,
    name: song.name ?? unknownSongName,
  };
}

export function useSearchData(keywords: string, activeCategory: Category) {
  const locale = useI18nStore((state) => state.locale);
  const keyword = keywords.trim();
  const isAll = activeCategory === "All";
  const usesComplexSearch = isAll;
  const loadSongs = isAll || activeCategory === "Songs";
  const loadAlbums = isAll || activeCategory === "Albums";
  const loadPlaylists = isAll || activeCategory === "Playlists";
  const loadPodcasts = activeCategory === "Podcasts";
  const loadVoices = activeCategory === "Voices";
  const loadArtists = isAll || activeCategory === "Artists";
  const complexQuery = useComplexSearchQuery(keyword, usesComplexSearch);
  const songQuery = useInfiniteSongSearchQuery(keyword, 30, !usesComplexSearch && loadSongs);
  const albumQuery = useInfiniteAlbumSearchQuery(keyword, 20, !usesComplexSearch && loadAlbums);
  const playlistQuery = useInfinitePlaylistSearchQuery(
    keyword,
    20,
    !usesComplexSearch && loadPlaylists,
  );
  const artistQuery = useInfiniteArtistSearchQuery(keyword, 20, !usesComplexSearch && loadArtists);
  const voiceListQuery = useInfiniteVoiceListSearchQuery(keyword, 30, loadPodcasts);
  const voiceSearchQuery = useInfiniteVoiceSearchQuery(keyword, 30, loadVoices);
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
          ? (songQuery.data?.pages.flatMap((page) => page.data?.resources ?? []) ?? [])
              .map((resource) => mapResourceToSong(resource, unknownAlbumName, unknownSongName))
              .filter((song): song is Song => song !== null)
          : [],
    [
      complexResults.songs,
      isAll,
      loadSongs,
      songQuery.data?.pages,
      unknownAlbumName,
      unknownSongName,
    ],
  );
  const albums = useMemo(
    () =>
      isAll
        ? complexResults.albums
        : loadAlbums
          ? (albumQuery.data?.pages.flatMap((page) => page.result?.albums ?? []) ?? []).map(
              (album) => mapSearchAlbum(album, unknownAlbumName),
            )
          : [],
    [albumQuery.data?.pages, complexResults.albums, isAll, loadAlbums, unknownAlbumName],
  );
  const playlists = useMemo(
    () =>
      isAll
        ? complexResults.playlists
        : loadPlaylists
          ? (playlistQuery.data?.pages.flatMap((page) => page.result?.playlists ?? []) ?? []).map(
              mapSearchPlaylist,
            )
          : [],
    [complexResults.playlists, isAll, loadPlaylists, playlistQuery.data?.pages],
  );
  const artists = useMemo(
    () =>
      isAll
        ? complexResults.artists
        : loadArtists
          ? (artistQuery.data?.pages.flatMap((page) => page.result?.artists ?? []) ?? []).map(
              mapSearchArtist,
            )
          : [],
    [artistQuery.data?.pages, complexResults.artists, isAll, loadArtists],
  );
  const podcasts = useMemo(
    () =>
      isAll
        ? complexResults.podcasts
        : loadPodcasts
          ? (voiceListQuery.data?.pages.flatMap(getVoiceListSearchItems) ?? [])
              .map((voiceList) => mapVoiceListSearchItem(voiceList, unknownPodcastName))
              .filter((podcast): podcast is Podcast => podcast !== null)
          : [],
    [complexResults.podcasts, isAll, loadPodcasts, unknownPodcastName, voiceListQuery.data?.pages],
  );
  const voices = useMemo(
    () =>
      isAll
        ? complexResults.voices
        : loadVoices
          ? (voiceSearchQuery.data?.pages
              .flatMap(getVoiceSearchItems)
              .map((voice) =>
                mapVoiceSearchItem(voice, unknownAlbumName, unknownPodcastName, unknownSongName),
              )
              .filter((voice): voice is NonNullable<typeof voice> => voice !== null) ?? [])
          : [],
    [
      complexResults.voices,
      isAll,
      loadVoices,
      unknownAlbumName,
      unknownPodcastName,
      unknownSongName,
      voiceSearchQuery.data?.pages,
    ],
  );
  const bestMatch = isAll ? complexResults.bestMatch : null;
  const loading = usesComplexSearch
    ? complexQuery.isLoading
    : (loadSongs && songQuery.isLoading) ||
      (loadAlbums && albumQuery.isLoading) ||
      (loadPlaylists && playlistQuery.isLoading) ||
      (loadPodcasts && voiceListQuery.isLoading) ||
      (loadVoices && voiceSearchQuery.isLoading) ||
      (loadArtists && artistQuery.isLoading);
  const hasError = usesComplexSearch
    ? complexQuery.isError
    : (loadSongs && songQuery.isError) ||
      (loadAlbums && albumQuery.isError) ||
      (loadPlaylists && playlistQuery.isError) ||
      (loadPodcasts && voiceListQuery.isError) ||
      (loadVoices && voiceSearchQuery.isError) ||
      (loadArtists && artistQuery.isError);

  const refetch = useCallback(async () => {
    if (usesComplexSearch) {
      await complexQuery.refetch();
      return;
    }

    await Promise.all([
      ...(loadSongs ? [songQuery.refetch()] : []),
      ...(loadAlbums ? [albumQuery.refetch()] : []),
      ...(loadPlaylists ? [playlistQuery.refetch()] : []),
      ...(loadPodcasts ? [voiceListQuery.refetch()] : []),
      ...(loadVoices ? [voiceSearchQuery.refetch()] : []),
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
    loadPodcasts,
    loadVoices,
    loadSongs,
    playlistQuery,
    songQuery,
    voiceListQuery,
    voiceSearchQuery,
  ]);

  return {
    albums,
    artists,
    bestMatch,
    hasError,
    fetchNextAlbumPage: albumQuery.fetchNextPage,
    fetchNextArtistPage: artistQuery.fetchNextPage,
    fetchNextPlaylistPage: playlistQuery.fetchNextPage,
    fetchNextPodcastPage: voiceListQuery.fetchNextPage,
    fetchNextSongPage: songQuery.fetchNextPage,
    fetchNextVoicePage: voiceSearchQuery.fetchNextPage,
    hasNextAlbumPage: Boolean(albumQuery.hasNextPage),
    hasNextArtistPage: Boolean(artistQuery.hasNextPage),
    hasNextPlaylistPage: Boolean(playlistQuery.hasNextPage),
    hasNextPodcastPage: Boolean(voiceListQuery.hasNextPage),
    hasNextSongPage: Boolean(songQuery.hasNextPage),
    hasNextVoicePage: Boolean(voiceSearchQuery.hasNextPage),
    isFetchingNextAlbumPage: albumQuery.isFetchingNextPage,
    isFetchingNextArtistPage: artistQuery.isFetchingNextPage,
    isFetchingNextPlaylistPage: playlistQuery.isFetchingNextPage,
    isFetchingNextPodcastPage: voiceListQuery.isFetchingNextPage,
    isFetchingNextSongPage: songQuery.isFetchingNextPage,
    isFetchingNextVoicePage: voiceSearchQuery.isFetchingNextPage,
    loading,
    playlists,
    podcasts,
    refetch,
    songs,
    voices,
  };
}
