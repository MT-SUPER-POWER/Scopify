"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Loader2, Play, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getAlbumDetail, getUserAlbumSublist } from "@/lib/api/album";
import { getHotArtists } from "@/lib/api/artist";
import {
  getPersonalizePlaylists,
  getPlaylistAllTracks,
  getRecommendedPlaylists,
} from "@/lib/api/playlist";
import { getUserDetail } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, formatPlayCount } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { RecommendPlaylist } from "@/types/api/playlist";
import type { NeteaseUserAlbum } from "../types/api/release";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TimeTheme = {
  start: number;
  end: number;
  greetingKey:
  | "home.greeting.night"
  | "home.greeting.morning"
  | "home.greeting.afternoon"
  | "home.greeting.evening";
  gradient: string;
};

// 色卡
const TIME_THEME_MAP: TimeTheme[] = [
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getTimeTheme = () => {
  const hour = new Date().getHours();

  const theme = TIME_THEME_MAP.find((t) => hour >= t.start && hour < t.end) ?? TIME_THEME_MAP[0];

  return {
    greetingKey: theme.greetingKey,
    gradient: theme.gradient,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  collapsedHeight?: string; // 修正：允许外部传入折叠时的高度
}

const CollapsibleHomeSection = ({
  title,
  children,
  action,
  defaultOpen = false,
  collapsedHeight = "180px", // 默认显示一行左右的高度
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { t } = useI18n();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="flex items-center justify-between group/section">
        <div className="flex items-center gap-2">
          {/* 标题 */}
          <div className="cursor-pointer">{title}</div>
        </div>

        {/* 右侧操作区 (Show all / Show less) */}
        <div className="flex items-center gap-4">
          {action}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "text-sm text-zinc-400 font-bold hover:text-white hover:underline cursor-pointer transition-colors flex items-center gap-1 outline-none",
              )}
            >
              {isOpen ? t("common.action.showLess") : t("common.action.showAll")}
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen ? "-rotate-90" : "rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{
            height: isOpen ? "auto" : collapsedHeight,
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="relative"
        >
          {children}

          {/* 未展开时的渐隐遮罩 */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-[#121212] via-[#121212]/80 to-transparent pointer-events-none z-10"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Collapsible>
  );
};

const HomePageComponent = () => {
  const { t, locale } = useI18n();
  const [playlists, setPlaylists] = useState<RecommendPlaylist[]>([]);
  const [bannerPlaylist, setBannerPlaylist] = useState<any[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const smartRouter = useSmartRouter();
  const isLogin = useLoginStatus();
  const user = useUserStore((s) => s.user);
  const userName = user?.nickname;
  const userId = user?.userId;
  const collectedAlbum = useUserStore((s) => s.collectedAlbum);
  const setCollectedAlbum = useUserStore((s) => s.setCollectedAlbum);
  const [dateInfo, setDateInfo] = useState({ dayOfWeek: "星期三", dateNum: 18 });
  const [hasError, setHasError] = useState(false);

  const { setQueue, playQueueIndex } = usePlayerStore();

  // ── 播放歌单 ──
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

  // ── 播放专辑 ──
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
            ...song, // 展开原来的 song 属性
            al: {
              ...song.al, // 展开原来的 song.al 属性
              // 核心在这里：覆盖或添加 picUrl 字段
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

  useEffect(() => {
    // 组件挂载后，获取真实的本地时间
    const today = new Date();
    setDateInfo({
      dayOfWeek: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(today),
      dateNum: today.getDate(),
    });
  }, [locale]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <t 的导入会导致无限请求>
  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    // 如果登录了但 store 里没用户信息，先同步拉取一次账号信息
    if (isLogin && (!user?.nickname || !userId)) {
      try {
        const cookie = localStorage.getItem("user_id") || "";
        const accountRes = await getUserDetail(cookie);
        if (accountRes.data?.profile) {
          console.log("同步用户信息到 store:", accountRes.data.profile);

          useUserStore.getState().setUser(accountRes.data.profile);
          useUserStore.getState().setUserId(accountRes.data.account?.id || "");
        }
      } catch (err) {
        console.error("同步用户信息失败:", err);
      }
    }

    const requests: any[] = [getPersonalizePlaylists(), getRecommendedPlaylists(), getHotArtists()];

    if (isLogin) requests.push(getUserAlbumSublist());

    Promise.all(requests)
      .then((results) => {
        const [personalRes, recommendRes, artistsRes, albumsRes] = results;

        const shuffled = [...recommendRes.data.recommend]
          .map((item, index) => ({ item, index }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
          .sort((a, b) => a.index - b.index)
          .map(({ item }) => item);

        setPlaylists(Array.isArray(personalRes.data.result) ? personalRes.data.result : []);
        setBannerPlaylist(Array.isArray(recommendRes.data.recommend) ? shuffled : []);
        setSuggestedArtists(Array.isArray(artistsRes.data.artists) ? artistsRes.data.artists : []);
        setCollectedAlbum(Array.isArray(albumsRes?.data.data) ? albumsRes.data.data : []);
      })
      .catch((error) => {
        console.error("获取首页数据失败:", error);
        setHasError(true);
        toast.error(t("home.toast.loadFailed"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLogin, setCollectedAlbum, user, userId]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  return (
    <div className="relative pb-24 font-sans">
      {/* 顶部彩色渐变背景 */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 bg-linear-to-b",
          getTimeTheme().gradient,
          "z-0 pointer-events-none",
        )}
      />

      <div className="relative z-10 p-6 pt-20 space-y-8">
        {/* 欢迎语与快速访问区块 */}
        <section>
          <CollapsibleHomeSection
            title={
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-white tracking-tight leading-none">
                  {t(getTimeTheme().greetingKey)}
                </h1>
                {(hasError || !isLoading) && (
                  <button
                    type="button"
                    onClick={() => fetchHomeData()}
                    disabled={isLoading}
                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                    title={t("home.refreshTitle")}
                  >
                    <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                  </button>
                )}
              </div>
            }
            collapsedHeight="160px" // Banner 2行的高度 (每行约 64px + gap)
          >
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 每日推荐 */}
              <div
                key={"DAILY_RECOMMENDATION"}
                onClick={() => smartRouter.push(`/playlist/?isDailyRecommend=true`)}
                className="flex items-center h-16 bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden group cursor-pointer relative pr-4"
              >
                {/* 拟物化日历 Icon */}
                <div className="h-16 w-16 shadow-[2px_0_8px_rgba(0,0,0,0.4)] z-10 shrink-0 flex flex-col rounded-l-md overflow-hidden bg-white select-none">
                  {/* 红色星期栏 */}
                  <div className="h-5.5 bg-linear-to-b from-[#e34242] to-[#c42b2b] flex items-center justify-center border-b border-black/10">
                    <span className="text-white text-[10px] font-medium tracking-[0.15em]">
                      {dateInfo.dayOfWeek}
                    </span>
                  </div>

                  {/* 白色日期主体带折痕 */}
                  <div className="flex-1 relative flex items-center justify-center bg-linear-to-b from-momo-light from-50% to-[#f0f0f0] to-50%">
                    {/* 拟物折痕 */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-black/5 shadow-[0_1px_1px_rgba(255,255,255,0.8)] -translate-y-1/2" />
                    <span className="text-3xl font-black text-[#2a2a2a] leading-none z-10 mt-1 tracking-tighter">
                      {dateInfo.dateNum}
                    </span>
                  </div>
                </div>

                <span className="text-white font-bold text-sm ml-4 truncate">
                  {t("home.dailyRecommendations")}
                </span>

                {/* 悬浮播放按钮 — 每日推荐导航到专属页面 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    smartRouter.push(`/playlist/?isDailyRecommend=true`);
                  }}
                  className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64]"
                >
                  <Play className="w-5 h-5 fill-current ml-1" />
                </button>
              </div>

              {bannerPlaylist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => smartRouter.push(`/playlist/?id=${item.id}&isRecommend=true`)}
                  className="flex items-center h-16 bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden group cursor-pointer relative pr-4"
                >
                  <Image
                    width={64}
                    height={64}
                    src={item.picUrl}
                    alt={t("playlist.form.coverAlt")}
                    className="h-16 w-16 object-cover shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10"
                  />
                  <span className="text-white font-bold text-sm ml-4 truncate">{item.name}</span>

                  {/* 悬浮播放按钮 */}
                  <button
                    type="button"
                    onClick={(e) => handlePlayPlaylist(item.id, e)}
                    disabled={loadingPlayId === `playlist-${item.id}`}
                    className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64] disabled:opacity-80"
                  >
                    {loadingPlayId === `playlist-${item.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleHomeSection>
        </section>

        {/* 推荐区块 */}
        <section>
          <CollapsibleHomeSection
            title={
              <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                {t("home.madeFor", { name: userName ?? t("home.you") })}
              </h2>
            }
            collapsedHeight="280px" // 推荐区块 1行左右的高度 (包含图片、标题和 padding)
          >
            {isLoading ? (
              // 骨架屏或简单 Loading 状态
              <div className="text-zinc-400 text-sm">{t("home.loadingRecommendations")}</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() =>
                      smartRouter.push(`/playlist/?id=${playlist.id}&isRecommend=true`)
                    }
                    className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group"
                  >
                    <div className="relative mb-4 pb-[100%]">
                      <Image
                        loading="eager"
                        width={300}
                        height={300}
                        src={`${playlist.picUrl}?param=300y300`}
                        alt={playlist.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                      />
                      <button
                        type="button"
                        onClick={(e) => handlePlayPlaylist(playlist.id, e)}
                        disabled={loadingPlayId === `playlist-${playlist.id}`}
                        className="absolute bottom-2 right-2 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#1fdf64] disabled:opacity-80"
                      >
                        {loadingPlayId === `playlist-${playlist.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-white font-bold truncate mb-1" title={playlist.name}>
                      {playlist.name}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {t("home.playlistSummary", {
                        plays: formatPlayCount(playlist.playCount),
                        count: playlist.trackCount,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleHomeSection>
        </section>

        {/* 新增区块 1: 推荐歌手 (Spotify 经典圆形卡片) */}
        <section>
          <CollapsibleHomeSection
            title={
              <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                {t("home.suggestedArtists")}
              </h2>
            }
            collapsedHeight="260px" // 歌手卡片 1行的高度
          >
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {suggestedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group flex flex-col items-center text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    smartRouter.push(`/artist?id=${artist.id}`);
                  }}
                >
                  {/* 圆形图片容器 */}
                  <div className="relative mb-4 w-full aspect-square">
                    <Image
                      width={200}
                      height={200}
                      src={`${artist.picUrl}?param=200y200`}
                      alt={artist.name}
                      className="absolute inset-0 w-full h-full object-cover rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                  <h3 className="text-white font-bold truncate w-full mb-1">{artist.name}</h3>
                </div>
              ))}
            </div>
          </CollapsibleHomeSection>
        </section>

        {/* 新增区块 2: 最新发行 (常规方形卡片，副标题弱化) */}
        {isLogin && collectedAlbum.length > 0 && (
          <section>
            <CollapsibleHomeSection
              title={
                <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                  {t("home.yourCollectedAlbums")}
                </h2>
              }
              collapsedHeight="280px" // 最新发行 1行的高度
            >
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {collectedAlbum.map((item: NeteaseUserAlbum) => (
                  <div
                    key={`new-${item.id}`}
                    onClick={() => smartRouter.push(`/album?id=${item.id}`)}
                    className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group"
                  >
                    <div className="relative mb-4 pb-[100%]">
                      <Image
                        src={item.picUrl}
                        alt={t("album.coverAlt")}
                        width={300}
                        height={300}
                        className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                        onClick={() => smartRouter.push(`/album?id=${item.id}`)}
                      />
                      <button
                        type="button"
                        onClick={(e) => handlePlayAlbum(item.id, e)}
                        disabled={loadingPlayId === `album-${item.id}`}
                        className="absolute bottom-2 right-2 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black s
                        hadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300
                        hover:scale-105 hover:bg-[#1fdf64] disabled:opacity-80"
                      >
                        {loadingPlayId === `album-${item.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-white font-bold truncate mb-1">{item.name}</h3>
                  </div>
                ))}
              </div>
            </CollapsibleHomeSection>
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePageComponent;
