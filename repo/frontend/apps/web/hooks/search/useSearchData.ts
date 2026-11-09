"use client";

import { useCallback, useMemo } from "react";

import {
  useInfiniteLyricSearchQuery,
  useInfiniteMvSearchQuery,
  useInfiniteSearchQuery,
  useInfiniteVoiceListSearchQuery,
  useInfiniteVoiceSearchQuery,
  useSearchOverviewQuery,
} from "@/hooks/search/useSearchQueries";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { translate } from "@/lib/i18n";
import { mapComplexSearchMedia } from "@/lib/search/complexSearchAdapter";
import {
  getVoiceListSearchItems,
  mapVoiceListSearchItem,
} from "@/lib/search/voiceListSearchAdapter";
import { getVoiceSearchItems, mapVoiceSearchItem } from "@/lib/search/voiceSearchAdapter";
import { useI18nStore } from "@/store/module/i18n";
import type { LyricSearchResource, SearchArtistSource } from "@/types/providers/netease/searchApi";
import type { Artist, Category, LyricSearchItem, Podcast, Song } from "@/types/search/model";

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

function mapLyricSearchResource(
  resource: LyricSearchResource,
  unknownAlbumName: string,
  unknownSongName: string,
): LyricSearchItem | null {
  const songData = resource.song;
  if (!songData) return null;

  const artists = songData.ar?.map(mapSearchArtist) ?? [];
  const albumPicUrl = isValidPicUrl(songData.al?.picUrl)
    ? songData.al.picUrl
    : isValidPicUrl(songData.al?.blurPicUrl)
      ? songData.al.blurPicUrl
      : "";

  const song: Song = {
    album: {
      artist: artists[0] ?? mapSearchArtist(undefined),
      id: songData.al?.id ?? 0,
      name: songData.al?.name ?? unknownAlbumName,
      picUrl: albumPicUrl,
      publishTime: 0,
      size: 0,
    },
    alias: songData.alia ?? songData.alias ?? [],
    artists,
    duration: songData.dt ?? 0,
    fee: songData.fee,
    id: songData.id,
    mvid: songData.mv ?? songData.mvid,
    name: songData.name ?? unknownSongName,
  };

  return {
    highlightText: resource.highlightText,
    lyric: resource.lyric ?? "",
    matchedLyric: resource.matchedLyric ?? "",
    song,
  };
}

export function useSearchData(keywords: string, activeCategory: Category) {
  const locale = useI18nStore((state) => state.locale);
  const keyword = keywords.trim();
  const hasOverview = useProviderCapability("search.overview");
  const canSearchLyrics = useProviderCapability("search.lyrics");
  const canSearchMvs = useProviderCapability("mv");
  const canSearchPodcasts = useProviderCapability("podcast");
  const isAll = activeCategory === "All";
  // One request ranks every kind together; platforms without it list each kind on its own.
  const usesOverview = isAll && hasOverview;
  const loadSongs = isAll || activeCategory === "Songs";
  const loadAlbums = isAll || activeCategory === "Albums";
  const loadPlaylists = isAll || activeCategory === "Playlists";
  const loadPodcasts = activeCategory === "Podcasts" && canSearchPodcasts;
  const loadVoices = activeCategory === "Voices" && canSearchPodcasts;
  const loadArtists = isAll || activeCategory === "Artists";
  const loadLyrics = activeCategory === "Lyrics" && canSearchLyrics;
  // 综合搜索不含 MV，全部视图与 MV 分类共用同一个 MV 查询
  const loadMvs = (isAll || activeCategory === "MVs") && canSearchMvs;
  const overviewQuery = useSearchOverviewQuery(keyword, usesOverview);
  const songQuery = useInfiniteSearchQuery("song", keyword, 30, !usesOverview && loadSongs);
  const lyricQuery = useInfiniteLyricSearchQuery(keyword, 30, loadLyrics);
  const albumQuery = useInfiniteSearchQuery("album", keyword, 20, !usesOverview && loadAlbums);
  const playlistQuery = useInfiniteSearchQuery(
    "playlist",
    keyword,
    20,
    !usesOverview && loadPlaylists,
  );
  const artistQuery = useInfiniteSearchQuery("artist", keyword, 20, !usesOverview && loadArtists);
  const voiceListQuery = useInfiniteVoiceListSearchQuery(keyword, 30, loadPodcasts);
  const voiceSearchQuery = useInfiniteVoiceSearchQuery(keyword, 30, loadVoices);
  const mvQuery = useInfiniteMvSearchQuery(keyword, 24, loadMvs);
  const unknownAlbumName = translate(locale, "common.meta.unknownAlbum");
  const unknownPodcastName = translate(locale, "search.podcast.unknown");
  const unknownSongName = translate(locale, "common.meta.unknownSong");
  const overview = overviewQuery.data;
  const overviewMedia = useMemo(
    () =>
      mapComplexSearchMedia(
        overview?.netease?.response,
        unknownAlbumName,
        unknownSongName,
        unknownPodcastName,
      ),
    [overview?.netease?.response, unknownAlbumName, unknownPodcastName, unknownSongName],
  );

  const songs = useMemo(
    () =>
      usesOverview
        ? (overview?.songs ?? [])
        : loadSongs
          ? (songQuery.data?.pages.flatMap((page) => page.items) ?? [])
          : [],
    [loadSongs, overview?.songs, songQuery.data?.pages, usesOverview],
  );
  const lyrics = useMemo(
    () =>
      loadLyrics
        ? (lyricQuery.data?.pages.flatMap((page) => page.data?.resources ?? []) ?? [])
            .map((resource) => mapLyricSearchResource(resource, unknownAlbumName, unknownSongName))
            .filter((item): item is LyricSearchItem => item !== null)
        : [],
    [loadLyrics, lyricQuery.data?.pages, unknownAlbumName, unknownSongName],
  );
  const albums = useMemo(
    () =>
      usesOverview
        ? (overview?.albums ?? [])
        : loadAlbums
          ? (albumQuery.data?.pages.flatMap((page) => page.items) ?? [])
          : [],
    [albumQuery.data?.pages, loadAlbums, overview?.albums, usesOverview],
  );
  const playlists = useMemo(
    () =>
      usesOverview
        ? (overview?.playlists ?? [])
        : loadPlaylists
          ? (playlistQuery.data?.pages.flatMap((page) => page.items) ?? [])
          : [],
    [loadPlaylists, overview?.playlists, playlistQuery.data?.pages, usesOverview],
  );
  const artists = useMemo(
    () =>
      usesOverview
        ? (overview?.artists ?? [])
        : loadArtists
          ? (artistQuery.data?.pages.flatMap((page) => page.items) ?? [])
          : [],
    [artistQuery.data?.pages, loadArtists, overview?.artists, usesOverview],
  );
  const podcasts = useMemo(
    () =>
      usesOverview
        ? overviewMedia.podcasts
        : loadPodcasts
          ? (voiceListQuery.data?.pages.flatMap(getVoiceListSearchItems) ?? [])
              .map((voiceList) => mapVoiceListSearchItem(voiceList, unknownPodcastName))
              .filter((podcast): podcast is Podcast => podcast !== null)
          : [],
    [
      loadPodcasts,
      overviewMedia.podcasts,
      unknownPodcastName,
      usesOverview,
      voiceListQuery.data?.pages,
    ],
  );
  const voices = useMemo(
    () =>
      usesOverview
        ? overviewMedia.voices
        : loadVoices
          ? (voiceSearchQuery.data?.pages
              .flatMap(getVoiceSearchItems)
              .map((voice) =>
                mapVoiceSearchItem(voice, unknownAlbumName, unknownPodcastName, unknownSongName),
              )
              .filter((voice): voice is NonNullable<typeof voice> => voice !== null) ?? [])
          : [],
    [
      loadVoices,
      overviewMedia.voices,
      unknownAlbumName,
      unknownPodcastName,
      unknownSongName,
      usesOverview,
      voiceSearchQuery.data?.pages,
    ],
  );
  const mvs = useMemo(
    () => (loadMvs ? (mvQuery.data?.pages.flatMap((page) => page.result?.mvs ?? []) ?? []) : []),
    [loadMvs, mvQuery.data?.pages],
  );
  const bestMatch = usesOverview ? (overview?.bestMatch ?? null) : null;
  const loading = usesOverview
    ? overviewQuery.isLoading
    : (loadSongs && songQuery.isLoading) ||
      (loadAlbums && albumQuery.isLoading) ||
      (loadPlaylists && playlistQuery.isLoading) ||
      (loadPodcasts && voiceListQuery.isLoading) ||
      (loadVoices && voiceSearchQuery.isLoading) ||
      (loadArtists && artistQuery.isLoading) ||
      (loadLyrics && lyricQuery.isLoading) ||
      (loadMvs && mvQuery.isLoading);
  const hasError = usesOverview
    ? overviewQuery.isError
    : (loadSongs && songQuery.isError) ||
      (loadAlbums && albumQuery.isError) ||
      (loadPlaylists && playlistQuery.isError) ||
      (loadPodcasts && voiceListQuery.isError) ||
      (loadVoices && voiceSearchQuery.isError) ||
      (loadArtists && artistQuery.isError) ||
      (loadLyrics && lyricQuery.isError) ||
      (loadMvs && mvQuery.isError);

  const refetch = useCallback(async () => {
    if (usesOverview) {
      await overviewQuery.refetch();
      return;
    }

    await Promise.all([
      ...(loadSongs ? [songQuery.refetch()] : []),
      ...(loadAlbums ? [albumQuery.refetch()] : []),
      ...(loadPlaylists ? [playlistQuery.refetch()] : []),
      ...(loadPodcasts ? [voiceListQuery.refetch()] : []),
      ...(loadVoices ? [voiceSearchQuery.refetch()] : []),
      ...(loadArtists ? [artistQuery.refetch()] : []),
      ...(loadLyrics ? [lyricQuery.refetch()] : []),
      ...(loadMvs ? [mvQuery.refetch()] : []),
    ]);
  }, [
    albumQuery,
    artistQuery,
    overviewQuery,
    lyricQuery,
    mvQuery,
    usesOverview,
    loadAlbums,
    loadArtists,
    loadLyrics,
    loadMvs,
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
    fetchNextLyricPage: lyricQuery.fetchNextPage,
    fetchNextMvPage: mvQuery.fetchNextPage,
    fetchNextPlaylistPage: playlistQuery.fetchNextPage,
    fetchNextPodcastPage: voiceListQuery.fetchNextPage,
    fetchNextSongPage: songQuery.fetchNextPage,
    fetchNextVoicePage: voiceSearchQuery.fetchNextPage,
    hasNextAlbumPage: Boolean(albumQuery.hasNextPage),
    hasNextArtistPage: Boolean(artistQuery.hasNextPage),
    hasNextLyricPage: Boolean(lyricQuery.hasNextPage),
    hasNextMvPage: Boolean(mvQuery.hasNextPage),
    hasNextPlaylistPage: Boolean(playlistQuery.hasNextPage),
    hasNextPodcastPage: Boolean(voiceListQuery.hasNextPage),
    hasNextSongPage: Boolean(songQuery.hasNextPage),
    hasNextVoicePage: Boolean(voiceSearchQuery.hasNextPage),
    isFetchingNextAlbumPage: albumQuery.isFetchingNextPage,
    isFetchingNextArtistPage: artistQuery.isFetchingNextPage,
    isFetchingNextLyricPage: lyricQuery.isFetchingNextPage,
    isFetchingNextMvPage: mvQuery.isFetchingNextPage,
    isFetchingNextPlaylistPage: playlistQuery.isFetchingNextPage,
    isFetchingNextPodcastPage: voiceListQuery.isFetchingNextPage,
    isFetchingNextSongPage: songQuery.isFetchingNextPage,
    isFetchingNextVoicePage: voiceSearchQuery.isFetchingNextPage,
    loading,
    lyrics,
    mvs,
    playlists,
    podcasts,
    refetch,
    songs,
    voices,
    /** The platform ranks a best match across kinds; otherwise the overview has none. */
    hasBestMatch: usesOverview,
  };
}
