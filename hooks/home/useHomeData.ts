import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAlbumDetail, getUserAlbumSublist } from "@/lib/api/album";
import { getHotArtists } from "@/lib/api/artist";
import {
  getPersonalizePlaylists,
  getPlaylistAllTracks,
  getRecommendedPlaylists,
} from "@/lib/api/playlist";
import { getUserDetail } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { RecommendPlaylist } from "@/types/api/playlist";

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
  const { setQueue, playQueueIndex } = usePlayerStore();

  const [playlists, setPlaylists] = useState<RecommendPlaylist[]>([]);
  const [bannerPlaylist, setBannerPlaylist] = useState<any[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [dateInfo, setDateInfo] = useState({ dayOfWeek: "星期三", dateNum: 18 });

  const [fetchingUser, setFetchingUser] = useState(false);

  useEffect(() => {
    const today = new Date();
    setDateInfo({
      dayOfWeek: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(today),
      dateNum: today.getDate(),
    });
  }, [locale]);

  const handlePlayPlaylist = useCallback(
    async (id: number | string, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `playlist-${id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const cookie =
          typeof window !== "undefined" ? localStorage.getItem("music_cookie") || "" : "";
        const res = await getPlaylistAllTracks({ id, cookie });
        const tracks: SongDetail[] = (res.data?.songs || []).map(pruneSongDetail);
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
        const tracks: SongDetail[] = (res.data?.songs || []).map((song: SongDetail) =>
          pruneSongDetail({
            ...song,
            al: {
              ...song.al,
              picUrl: song.al?.picUrl || res.data?.album?.picUrl || res.data?.album?.blurPicUrl,
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
    setIsLoading(true);
    setHasError(false);
    if (isLogin && (!user?.nickname || !userId) && !fetchingUser) {
      setFetchingUser(true);
      try {
        const cookie = localStorage.getItem("user_id") || "";
        const accountRes = await getUserDetail(cookie);
        if (accountRes.data?.profile) {
          useUserStore.getState().setUser(accountRes.data.profile);
          useUserStore.getState().setUserId(accountRes.data.account?.id || "");
        }
      } catch (err) {
        console.error("同步用户信息失败:", err);
      } finally {
        setFetchingUser(false);
      }
    }

    const requests: any[] = [
      getPersonalizePlaylists(),
      isLogin ? getRecommendedPlaylists() : { data: { recommend: [] } },
      getHotArtists(),
    ];
    if (isLogin) requests.push(getUserAlbumSublist());

    Promise.all(requests)
      .then((results) => {
        const [personalRes, recommendRes, artistsRes, albumsRes] = results;
        const shuffled = [...(recommendRes.data?.recommend || [])]
          .map((item, index) => ({ item, index }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
          .sort((a, b) => a.index - b.index)
          .map(({ item }) => item);
        setPlaylists(Array.isArray(personalRes.data.result) ? personalRes.data.result : []);
        setBannerPlaylist(Array.isArray(recommendRes.data?.recommend) ? shuffled : []);
        setSuggestedArtists(Array.isArray(artistsRes.data.artists) ? artistsRes.data.artists : []);
        setCollectedAlbum(Array.isArray(albumsRes?.data.data) ? albumsRes.data.data : []);
      })
      .catch((error) => {
        console.error("获取首页数据失败:", error);
        setHasError(true);
        toast.error(t("home.toast.loadFailed"));
      })
      .finally(() => setIsLoading(false));
  }, [isLogin, setCollectedAlbum, user, userId, fetchingUser, t]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

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
