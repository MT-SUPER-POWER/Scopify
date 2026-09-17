import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAlbumDetailData } from "@/lib/api/album";
import { getArtistTopSongs } from "@/lib/api/artist";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { NeteaseAlbum } from "@/types/api/album";
import type { ToplistDetailItem } from "@/types/api/toplist";
import type {
  RecommendedVoice,
  RecommendedVoiceArtist,
  RecommendedVoiceSong,
  RecommendedVoiceListsResponse,
} from "@/types/api/voicelist";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import { pruneRecommendPlaylist, type RawRecommendPlaylist } from "@/types/api/playlist";
import type { Artist, Song, Voice } from "@/types/search";
import {
  useFollowedArtistsAlbumsQuery,
  useFollowedArtistsQuery,
  useHomeUserProfileQuery,
  useHotArtistsQuery,
  useNewAlbumsQuery,
  useNewSongsQuery,
  usePersonalizedPlaylistsQuery,
  useRecentPlaylistsQuery,
  useRecommendedPlaylistsQuery,
  useRecommendedVoiceListsQuery,
  useToplistDetailQuery,
} from "./useHomeQueries";

export interface ArtistTopListItem {
  id: number;
  name: string;
  picUrl: string;
  musicSize?: number;
}

function getRecommendedVoices(response: RecommendedVoiceListsResponse | undefined) {
  return response?.data?.recommendVoiceVOS ?? [];
}

function toArtist(source: RecommendedVoiceArtist): Artist {
  return {
    id: source.id ?? 0,
    name: source.name ?? "",
    picUrl: source.picUrl ?? null,
  };
}

function toSong(
  source: RecommendedVoiceSong | undefined,
  fallbackCoverUrl: string,
  unknownAlbumName: string,
  unknownSongName: string,
): Song | null {
  if (!source?.id) return null;

  const artists = (source.artists ?? source.ar ?? []).map(toArtist);
  const album = source.album ?? source.al;

  return {
    album: {
      artist: artists[0] ?? { id: 0, name: "", picUrl: null },
      id: album?.id ?? 0,
      name: album?.name ?? unknownAlbumName,
      picUrl: resolveCoverUrl(album?.picUrl, album?.blurPicUrl, fallbackCoverUrl),
      publishTime: 0,
      size: 0,
    },
    artists,
    duration: source.duration ?? source.dt ?? 0,
    id: source.id,
    name: source.name ?? unknownSongName,
  };
}

function toRecommendedVoice(
  voice: RecommendedVoice,
  fallbackPodcastName: string,
  unknownAlbumName: string,
  unknownSongName: string,
): Voice | null {
  if (!voice.id) return null;

  const coverUrl = voice.picUrl ?? "";
  const mainSong = toSong(voice.djProgram?.mainSong, coverUrl, unknownAlbumName, unknownSongName);

  return {
    coverUrl,
    duration: voice.duration ?? mainSong?.duration ?? 0,
    hostName: voice.djProgram?.dj?.nickname,
    id: voice.id,
    mainSong,
    name: voice.name ?? unknownSongName,
    podcastName: voice.radioName ?? fallbackPodcastName,
  };
}

export function useHomeData() {
  const { t, locale } = useI18n();
  const isLogin = useLoginStatus();
  const user = useUserStore((s) => s.user);
  const userName = user?.nickname;
  const userId = user?.userId;
  const setUser = useUserStore((s) => s.setUser);
  const setUserId = useUserStore((s) => s.setUserId);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const [dateInfo, setDateInfo] = useState({ dayOfWeek: "星期三", dateNum: 18 });

  const storedUserId =
    isLogin && (!user?.nickname || !userId) && typeof window !== "undefined"
      ? window.localStorage.getItem("user_id")
      : null;
  const personalizedQuery = usePersonalizedPlaylistsQuery();
  const recommendedQuery = useRecommendedPlaylistsQuery(isLogin);
  const recommendedVoiceListsQuery = useRecommendedVoiceListsQuery();
  const hotArtistsQuery = useHotArtistsQuery();
  const newSongsQuery = useNewSongsQuery();
  const toplistsQuery = useToplistDetailQuery();
  const newAlbumsQuery = useNewAlbumsQuery();
  const recentPlaylistsQuery = useRecentPlaylistsQuery(isLogin);
  const followedArtistsQuery = useFollowedArtistsQuery(isLogin);
  const followedArtistsAlbumsQuery = useFollowedArtistsAlbumsQuery(isLogin);
  const userProfileQuery = useHomeUserProfileQuery(storedUserId);

  const bannerPlaylist = useMemo(() => {
    return personalizedQuery.data?.result?.map(pruneRecommendPlaylist) ?? [];
  }, [personalizedQuery.data?.result]);

  const playlists = useMemo(() => {
    const userRecommendations = recommendedQuery.data?.recommend;
    if (isLogin && userRecommendations && userRecommendations.length > 0) {
      return userRecommendations.map(pruneRecommendPlaylist);
    }
    return personalizedQuery.data?.result?.map(pruneRecommendPlaylist) ?? [];
  }, [isLogin, recommendedQuery.data?.recommend, personalizedQuery.data?.result]);
  const suggestedArtists = hotArtistsQuery.data?.artists ?? [];
  const recommendedVoiceLists = useMemo(
    () =>
      getRecommendedVoices(recommendedVoiceListsQuery.data)
        .map((voice) =>
          toRecommendedVoice(
            voice,
            t("home.voiceListMeta"),
            t("common.meta.unknownAlbum"),
            t("common.meta.unknownSong"),
          ),
        )
        .filter((voice): voice is Voice => voice !== null),
    [recommendedVoiceListsQuery.data, t],
  );

  const newSongs = useMemo(() => {
    return (newSongsQuery.data?.result ?? [])
      .map((item) => pruneSongDetail(item.song))
      .filter((song): song is SongDetail => Boolean(song?.id));
  }, [newSongsQuery.data?.result]);

  const OFFICIAL_TOPLIST_IDS = useMemo(() => [19723756, 3779629, 3778678, 2884035], []);

  const toplists = useMemo(() => {
    const list = toplistsQuery.data?.list ?? [];
    if (!list.length) return [];
    const chartMap = new Map(list.map((item) => [item.id, item]));
    const matched = OFFICIAL_TOPLIST_IDS.map((id) => chartMap.get(id)).filter(
      (item): item is ToplistDetailItem => Boolean(item && item.tracks && item.tracks.length > 0),
    );
    if (matched.length >= 4) return matched.slice(0, 4);
    const remaining = list.filter(
      (item) => !OFFICIAL_TOPLIST_IDS.includes(item.id) && item.tracks && item.tracks.length > 0,
    );
    return [...matched, ...remaining].slice(0, 4);
  }, [OFFICIAL_TOPLIST_IDS, toplistsQuery.data?.list]);

  const newAlbums = useMemo(() => {
    return (newAlbumsQuery.data?.albums ?? []).filter((album): album is NeteaseAlbum =>
      Boolean(album?.id && album?.name),
    );
  }, [newAlbumsQuery.data?.albums]);

  const recentPlaylists = useMemo(() => {
    if (!isLogin) return [];
    const list = recentPlaylistsQuery.data?.data?.list ?? [];
    return list
      .map((entry) => entry.data)
      .filter((item): item is RawRecommendPlaylist => Boolean(item?.id && item?.name))
      .map(pruneRecommendPlaylist);
  }, [isLogin, recentPlaylistsQuery.data?.data?.list]);

  const artistTopList = useMemo(() => {
    const followed = followedArtistsQuery.data?.data ?? [];
    if (isLogin && followed.length > 0) {
      return followed.map((artist) => ({
        id: artist.id,
        name: artist.name,
        picUrl: artist.picUrl || artist.avatarUrl || artist.img1v1Url || "",
        musicSize: (artist as { musicSize?: number }).musicSize,
      }));
    }
    return (hotArtistsQuery.data?.artists ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      picUrl: artist.picUrl || artist.img1v1Url || "",
      musicSize: artist.musicSize,
    }));
  }, [followedArtistsQuery.data?.data, hotArtistsQuery.data?.artists, isLogin]);

  const followedAlbums = useMemo(() => {
    return (followedArtistsAlbumsQuery.data ?? []).filter((album): album is NeteaseAlbum =>
      Boolean(album?.id && album?.name),
    );
  }, [followedArtistsAlbumsQuery.data]);

  const isLoading =
    personalizedQuery.isFetching ||
    recommendedQuery.isFetching ||
    recommendedVoiceListsQuery.isFetching ||
    hotArtistsQuery.isFetching ||
    newSongsQuery.isFetching ||
    toplistsQuery.isFetching ||
    newAlbumsQuery.isFetching;
  const hasError =
    personalizedQuery.isError ||
    recommendedQuery.isError ||
    recommendedVoiceListsQuery.isError ||
    hotArtistsQuery.isError ||
    newSongsQuery.isError ||
    toplistsQuery.isError ||
    newAlbumsQuery.isError;
  const hasHomeContent =
    playlists.length > 0 ||
    bannerPlaylist.length > 0 ||
    recommendedVoiceLists.length > 0 ||
    suggestedArtists.length > 0 ||
    newSongs.length > 0 ||
    toplists.length > 0 ||
    newAlbums.length > 0 ||
    recentPlaylists.length > 0 ||
    artistTopList.length > 0 ||
    followedAlbums.length > 0;
  const isUnavailable =
    !isLoading &&
    !hasHomeContent &&
    personalizedQuery.isError &&
    recommendedVoiceListsQuery.isError &&
    hotArtistsQuery.isError &&
    newSongsQuery.isError;

  useEffect(() => {
    const today = new Date();
    setDateInfo({
      dayOfWeek: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(today),
      dateNum: today.getDate(),
    });
  }, [locale]);

  useEffect(() => {
    const profile = userProfileQuery.data?.profile;
    if (!profile) return;

    setUser(profile);
    setUserId(profile.userId);
  }, [setUser, setUserId, userProfileQuery.data?.profile]);

  const handlePlayPlaylist = useCallback(
    async (id: number | string, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `playlist-${id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const res = await getPlaylistAllTracks({ id });
        const tracks: SongDetail[] = (res.data.songs ?? []).map(pruneSongDetail);
        if (!tracks.length) {
          toast.error(t("home.toast.playlistEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(t("home.toast.loadPlaylistFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex, t],
  );

  const handlePlaySong = useCallback(
    async (song: SongDetail, index: number) => {
      setQueue(newSongs, index);
      await playTrack(song);
    },
    [newSongs, setQueue, playTrack],
  );

  const handlePlayAllNewSongs = useCallback(async () => {
    if (!newSongs.length) return;
    setQueue(newSongs, 0);
    await playTrack(newSongs[0]);
  }, [newSongs, setQueue, playTrack]);

  const handlePlayAlbum = useCallback(
    async (id: number | string, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `album-${id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const res = await getAlbumDetailData(id);
        const tracks: SongDetail[] = (res.songs ?? []).map(pruneSongDetail);
        if (!tracks.length) {
          toast.error(t("home.toast.playlistEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(t("home.toast.loadPlaylistFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex, t],
  );

  const handlePlayArtistTopSongs = useCallback(
    async (artistId: number | string, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `artist-${artistId}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const res = await getArtistTopSongs(artistId, 50);
        const tracks: SongDetail[] = (res.data.songs ?? []).map(pruneSongDetail);
        if (!tracks.length) {
          toast.error(t("home.toast.playlistEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(t("home.toast.loadPlaylistFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex, t],
  );

  const refreshRecommendedVoiceLists = useCallback(async () => {
    await recommendedVoiceListsQuery.refetch();
  }, [recommendedVoiceListsQuery]);

  const fetchHomeData = useCallback(async () => {
    await Promise.all([
      personalizedQuery.refetch(),
      hotArtistsQuery.refetch(),
      recommendedVoiceListsQuery.refetch(),
      newSongsQuery.refetch(),
      toplistsQuery.refetch(),
      newAlbumsQuery.refetch(),
      ...(isLogin
        ? [
            recommendedQuery.refetch(),
            recentPlaylistsQuery.refetch(),
            followedArtistsQuery.refetch(),
            followedArtistsAlbumsQuery.refetch(),
          ]
        : []),
      ...(storedUserId ? [userProfileQuery.refetch()] : []),
    ]);
  }, [
    followedArtistsAlbumsQuery,
    followedArtistsQuery,
    hotArtistsQuery,
    isLogin,
    newAlbumsQuery,
    newSongsQuery,
    personalizedQuery,
    recentPlaylistsQuery,
    recommendedQuery,
    recommendedVoiceListsQuery,
    storedUserId,
    toplistsQuery,
    userProfileQuery,
  ]);

  return {
    playlists,
    bannerPlaylist,
    suggestedArtists,
    recommendedVoiceLists,
    newSongs,
    toplists,
    newAlbums,
    recentPlaylists,
    artistTopList,
    followedAlbums,
    isRefreshingVoiceLists: recommendedVoiceListsQuery.isFetching,
    isLoading,
    isUnavailable,
    loadingPlayId,
    hasError,
    dateInfo,
    userName,
    userId,
    isLogin,
    setLoadingPlayId,
    handlePlayPlaylist,
    handlePlaySong,
    handlePlayAllNewSongs,
    handlePlayAlbum,
    handlePlayArtistTopSongs,
    refreshRecommendedVoiceLists,
    fetchHomeData,
    t,
  };
}
