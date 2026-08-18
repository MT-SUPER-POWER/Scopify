import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type {
  RecommendedVoice,
  RecommendedVoiceArtist,
  RecommendedVoiceSong,
  RecommendedVoiceListsResponse,
} from "@/types/api/voicelist";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import { pruneRecommendPlaylist } from "@/types/api/playlist";
import type { Artist, Song, Voice } from "@/types/search";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import {
  useHomeUserProfileQuery,
  useHotArtistsQuery,
  usePersonalizedPlaylistsQuery,
  useRecommendedPlaylistsQuery,
  useRecommendedVoiceListsQuery,
} from "./useHomeQueries";

export interface TimeTheme {
  start: number;
  end: number;
  greetingKey:
    | "home.greeting.night"
    | "home.greeting.morning"
    | "home.greeting.afternoon"
    | "home.greeting.evening";
  gradient: string;
}

export const TIME_THEMES: TimeTheme[] = [
  {
    start: 0,
    end: 5,
    greetingKey: "home.greeting.night",
    gradient: "from-home-atmosphere-night/90 via-surface-raised/80 to-surface-raised h-80",
  },
  {
    start: 5,
    end: 7,
    greetingKey: "home.greeting.morning",
    gradient: "from-home-atmosphere-dawn/45 via-home-atmosphere-sunset/30 to-surface-raised h-30",
  },
  {
    start: 7,
    end: 10,
    greetingKey: "home.greeting.morning",
    gradient: "from-home-atmosphere-morning/60 via-surface-raised/80 to-surface-raised h-80",
  },
  {
    start: 10,
    end: 14,
    greetingKey: "home.greeting.afternoon",
    gradient: "from-home-atmosphere-afternoon/65 via-surface-raised/80 to-surface-raised h-80",
  },
  {
    start: 14,
    end: 17,
    greetingKey: "home.greeting.afternoon",
    gradient: "from-home-atmosphere-daylight/60 via-surface-raised/80 to-surface-raised h-80",
  },
  {
    start: 17,
    end: 19,
    greetingKey: "home.greeting.evening",
    gradient:
      "from-home-atmosphere-sunset/45 via-home-atmosphere-evening/30 to-surface-raised h-40",
  },
  {
    start: 19,
    end: 22,
    greetingKey: "home.greeting.evening",
    gradient: "from-home-atmosphere-evening/80 via-surface-raised/85 to-surface-raised h-80",
  },
  {
    start: 22,
    end: 24,
    greetingKey: "home.greeting.night",
    gradient: "from-home-atmosphere-late-night/90 via-surface-raised/85 to-surface-raised h-80",
  },
];

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

export function getTimeTheme() {
  const hour = new Date().getHours();
  return TIME_THEMES.find((t) => hour >= t.start && hour < t.end) ?? TIME_THEMES[0];
}

export function useHomeData() {
  const { t, locale } = useI18n();
  const isLogin = useLoginStatus();
  const user = useUserStore((s) => s.user);
  const userName = user?.nickname;
  const userId = user?.userId;
  const setUser = useUserStore((s) => s.setUser);
  const setUserId = useUserStore((s) => s.setUserId);
  const { setQueue, playQueueIndex } = usePlayerStore();

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
  const isLoading =
    personalizedQuery.isFetching ||
    recommendedQuery.isFetching ||
    recommendedVoiceListsQuery.isFetching ||
    hotArtistsQuery.isFetching;
  const hasError =
    personalizedQuery.isError ||
    recommendedQuery.isError ||
    recommendedVoiceListsQuery.isError ||
    hotArtistsQuery.isError;
  const hasHomeContent =
    playlists.length > 0 ||
    bannerPlaylist.length > 0 ||
    recommendedVoiceLists.length > 0 ||
    suggestedArtists.length > 0;
  const isUnavailable =
    !isLoading &&
    !hasHomeContent &&
    personalizedQuery.isError &&
    recommendedVoiceListsQuery.isError &&
    hotArtistsQuery.isError;

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
        const cookie = getMusicSessionCredential() ?? "";
        const res = await getPlaylistAllTracks({ id, cookie });
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
      ...(isLogin ? [recommendedQuery.refetch()] : []),
      ...(storedUserId ? [userProfileQuery.refetch()] : []),
    ]);
  }, [
    hotArtistsQuery,
    isLogin,
    personalizedQuery,
    recommendedQuery,
    recommendedVoiceListsQuery,
    storedUserId,
    userProfileQuery,
  ]);

  return {
    playlists,
    bannerPlaylist,
    suggestedArtists,
    recommendedVoiceLists,
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
    refreshRecommendedVoiceLists,
    fetchHomeData,
    t,
  };
}
