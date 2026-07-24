import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAlbumDetail } from "@/lib/api/album";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";
import { pruneRecommendPlaylist } from "@/types/api/playlist";
import {
  useCollectedAlbumsQuery,
  useHomeUserProfileQuery,
  useHotArtistsQuery,
  usePersonalizedPlaylistsQuery,
  useRecommendedPlaylistsQuery,
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
    gradient: "from-indigo-950/90 via-[#121212]/80 to-[#121212] h-80",
  },
  {
    start: 5,
    end: 7,
    greetingKey: "home.greeting.morning",
    gradient: "from-rose-300/45 via-orange-200/30 to-[#121212] h-30",
  },
  {
    start: 7,
    end: 10,
    greetingKey: "home.greeting.morning",
    gradient: "from-sky-300/60 via-[#121212]/80 to-[#121212] h-80",
  },
  {
    start: 10,
    end: 14,
    greetingKey: "home.greeting.afternoon",
    gradient: "from-sky-500/65 via-[#121212]/80 to-[#121212] h-80",
  },
  {
    start: 14,
    end: 17,
    greetingKey: "home.greeting.afternoon",
    gradient: "from-cyan-400/60 via-[#121212]/80 to-[#121212] h-80",
  },
  {
    start: 17,
    end: 19,
    greetingKey: "home.greeting.evening",
    gradient: "from-orange-400/45 via-purple-500/30 to-[#121212] h-40",
  },
  {
    start: 19,
    end: 22,
    greetingKey: "home.greeting.evening",
    gradient: "from-violet-900/80 via-[#121212]/85 to-[#121212] h-80",
  },
  {
    start: 22,
    end: 24,
    greetingKey: "home.greeting.night",
    gradient: "from-slate-900/90 via-[#121212]/85 to-[#121212] h-80",
  },
];

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
  const setCollectedAlbum = useUserStore((s) => s.setCollectedAlbum);
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
  const hotArtistsQuery = useHotArtistsQuery();
  const collectedAlbumsQuery = useCollectedAlbumsQuery(isLogin);
  const userProfileQuery = useHomeUserProfileQuery(storedUserId);

  const playlists = useMemo(
    () => personalizedQuery.data?.result?.map(pruneRecommendPlaylist) ?? [],
    [personalizedQuery.data?.result],
  );
  const bannerPlaylist = useMemo(() => {
    const recommendations = recommendedQuery.data?.recommend ?? [];

    return recommendations
      .map((item, index) => ({ index, item: pruneRecommendPlaylist(item) }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
      .sort((a, b) => a.index - b.index)
      .map(({ item }) => item);
  }, [recommendedQuery.data?.recommend]);
  const suggestedArtists = hotArtistsQuery.data?.artists ?? [];
  const isLoading =
    personalizedQuery.isFetching ||
    recommendedQuery.isFetching ||
    hotArtistsQuery.isFetching ||
    collectedAlbumsQuery.isFetching;
  const hasError =
    personalizedQuery.isError ||
    recommendedQuery.isError ||
    hotArtistsQuery.isError ||
    collectedAlbumsQuery.isError;

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

  useEffect(() => {
    if (!isLogin) return;
    setCollectedAlbum(collectedAlbumsQuery.data?.data ?? []);
  }, [collectedAlbumsQuery.data?.data, isLogin, setCollectedAlbum]);

  const handlePlayPlaylist = useCallback(
    async (id: number | string, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `playlist-${id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const cookie =
          typeof window !== "undefined" ? (window.localStorage.getItem("music_cookie") ?? "") : "";
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

  const handlePlayAlbum = useCallback(
    async (id: number | string, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `album-${id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const res = await getAlbumDetail(id);
        const tracks: SongDetail[] = (res.data.songs ?? []).map((song: RawSongDetail) =>
          pruneSongDetail({
            ...song,
            al: {
              id: song.al?.id ?? 0,
              name: song.al?.name ?? "",
              picUrl:
                song.al?.picUrl ?? res.data?.album?.picUrl ?? res.data?.album?.blurPicUrl ?? "",
            },
          }),
        );
        if (!tracks.length) {
          toast.error(t("home.toast.albumEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(t("home.toast.loadAlbumFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex, t],
  );

  const fetchHomeData = useCallback(async () => {
    await Promise.all([
      personalizedQuery.refetch(),
      hotArtistsQuery.refetch(),
      ...(isLogin ? [recommendedQuery.refetch(), collectedAlbumsQuery.refetch()] : []),
      ...(storedUserId ? [userProfileQuery.refetch()] : []),
    ]);
  }, [
    collectedAlbumsQuery,
    hotArtistsQuery,
    isLogin,
    personalizedQuery,
    recommendedQuery,
    storedUserId,
    userProfileQuery,
  ]);

  return {
    playlists,
    bannerPlaylist,
    suggestedArtists,
    isLoading,
    loadingPlayId,
    hasError,
    dateInfo,
    userName,
    userId,
    setLoadingPlayId,
    handlePlayPlaylist,
    handlePlayAlbum,
    fetchHomeData,
    t,
  };
}
