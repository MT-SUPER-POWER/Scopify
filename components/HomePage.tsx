"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from "react";
import { cn, formatPlayCount } from "@/lib/utils";
import { Play, ChevronRight } from "lucide-react";
import { getPersonalizePlaylists, getRecommendedPlaylists } from "@/lib/api/playlist";
import { getHotArtists } from "@/lib/api/arist";
import { RecommendPlaylist } from "@/types/api/playlist";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { NeteaseUserAlbum } from '../types/api/release';
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { getUserAlbumSublist } from "@/lib/api/release";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TimeTheme = {
  start: number;
  end: number;
  greeting: string;
  gradient: string;
};

const TIME_THEME_MAP: TimeTheme[] = [
  { start: 0, end: 5, greeting: "Good Night", gradient: "from-indigo-950/90 via-[#121212]/80 to-[#121212] h-80" },
  { start: 5, end: 7, greeting: "Good Morning", gradient: "from-rose-300/45 via-orange-200/30 to-[#121212] h-30" },
  { start: 7, end: 10, greeting: "Good Morning", gradient: "from-sky-300/60 via-[#121212]/80 to-[#121212] h-80" },
  { start: 10, end: 14, greeting: "Good Afternoon", gradient: "from-sky-500/65 via-[#121212]/80 to-[#121212] h-80" },
  { start: 14, end: 17, greeting: "Good Afternoon", gradient: "from-cyan-400/60 via-[#121212]/80 to-[#121212] h-80" },
  { start: 17, end: 19, greeting: "Good Evening", gradient: "from-orange-400/60 via-purple-500/40 to-[#121212] h-80" },
  { start: 19, end: 22, greeting: "Good Evening", gradient: "from-violet-900/80 via-[#121212]/85 to-[#121212] h-80" },
  { start: 22, end: 24, greeting: "Good Night", gradient: "from-slate-900/90 via-[#121212]/85 to-[#121212] h-80" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getTimeTheme = () => {
  const hour = new Date().getHours();

  const theme =
    TIME_THEME_MAP.find((t) => hour >= t.start && hour < t.end) ??
    TIME_THEME_MAP[0];

  return {
    greeting: theme.greeting,
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

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-4"
    >
      <div className="flex items-center justify-between group/section">
        <div className="flex items-center gap-2">
          {/* 标题 */}
          <div className="cursor-pointer">
            {title}
          </div>
        </div>

        {/* 右侧操作区 (Show all / Show less) */}
        <div className="flex items-center gap-4">
          {action}
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "text-sm text-zinc-400 font-bold hover:text-white hover:underline cursor-pointer transition-colors flex items-center gap-1 outline-none"
              )}
            >
              {isOpen ? "Show less" : "Show all"}
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen ? "-rotate-90" : "rotate-90"
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
  const [playlists, setPlaylists] = useState<RecommendPlaylist[]>([]);
  const [bannerPlaylist, setBannerPlaylist] = useState<any[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const smartRouter = useSmartRouter();
  const isLogin = useLoginStatus();
  const userName = useUserStore(s => s.user?.nickname);
  const [collectedAlbum, setCollectedAlbum] = useState([] as NeteaseUserAlbum[]);
  const [dateInfo, setDateInfo] = useState({
    dayOfWeek: '星期三', // 默认占位符
    dateNum: 18
  });

  useEffect(() => {
    // 组件挂载后，获取真实的本地时间
    const today = new Date();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    setDateInfo({
      dayOfWeek: days[today.getDay()],
      dateNum: today.getDate()
    });

    const fetchHomeData = async () => {
      setIsLoading(true);
      Promise.all([
        getPersonalizePlaylists(),
        getRecommendedPlaylists(),
        getHotArtists(),
        getUserAlbumSublist()
      ]).then(([personalRes, recommendRes, artistsRes, albumsRes]) => {

        const shuffled = [...recommendRes.data.recommend]
          .map((item, index) => ({ item, index }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
          .sort((a, b) => a.index - b.index)
          .map(({ item }) => item);

        setPlaylists(Array.isArray(personalRes.data.result) ? personalRes.data.result : []);
        setBannerPlaylist(Array.isArray(recommendRes.data.recommend) ? shuffled : []);
        // console.log("UserAlbumData: ", albumsRes.data);
        setCollectedAlbum(Array.isArray(albumsRes.data.data) ? albumsRes.data.data : []);
        setSuggestedArtists(Array.isArray(artistsRes.data.artists) ? artistsRes.data.artists : []);

      }).catch((error) => {
        console.error("获取首页数据失败:", error);
      }).finally(() => {
        setIsLoading(false);
      });
    }
    fetchHomeData();
  }, []);

  return (
    <div className="relative pb-24 font-sans">
      {/* 顶部彩色渐变背景 */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 bg-linear-to-b",
          getTimeTheme().gradient, "z-0 pointer-events-none"
        )}
      />

      <div className="relative z-10 p-6 pt-20 space-y-8">

        {/* 欢迎语与快速访问区块 */}
        <section>
          <CollapsibleHomeSection
            title={
              <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
                {getTimeTheme().greeting}
              </h1>
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
                  Daily Recommendations
                </span>

                {/* 悬浮播放按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    smartRouter.push(`/playlist/?isDailyRecommend=true`);
                  }}
                  className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64]">
                  <Play className="w-5 h-5 fill-current ml-1" />
                </button>
              </div>

              {bannerPlaylist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center h-16 bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden group cursor-pointer relative pr-4"
                >
                  <img
                    src={item.picUrl}
                    alt="cover"
                    className="h-16 w-16 object-cover shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10"
                  />
                  <span className="text-white font-bold text-sm ml-4 truncate">
                    {item.name}
                  </span>

                  {/* 悬浮播放按钮 */}
                  <button onClick={() => smartRouter.push(`/playlist/?id=${item.id}&isRecommend=true`)}
                    className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64]">
                    <Play className="w-5 h-5 fill-current ml-1" />
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
                Made For {userName}
              </h2>
            }
            collapsedHeight="280px" // 推荐区块 1行左右的高度 (包含图片、标题和 padding)
          >
            {isLoading ? (
              // 骨架屏或简单 Loading 状态
              <div className="text-zinc-400 text-sm">正在加载推荐...</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group"
                  >
                    <div className="relative mb-4 pb-[100%]">
                      <img
                        src={`${playlist.picUrl}?param=300y300`}
                        alt={playlist.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                      />
                      <button onClick={() => { smartRouter.push(`/playlist/?id=${playlist.id}&isRecommend=true`) }}
                        className="absolute bottom-2 right-2 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#1fdf64]">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </button>
                    </div>
                    {/* 添加 line-clamp 防止标题过长撑破卡片 */}
                    <h3 className="text-white font-bold truncate mb-1" title={playlist.name}>
                      {playlist.name}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {formatPlayCount(playlist.playCount)} 播放 • 共 {playlist.trackCount} 首
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
                Suggested Artists
              </h2>
            }
            collapsedHeight="260px" // 歌手卡片 1行的高度
          >
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {suggestedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group flex flex-col items-center text-center"
                >
                  {/* 圆形图片容器 */}
                  <div className="relative mb-4 w-full aspect-square">
                    <img
                      src={`${artist.picUrl}?param=200y200`}
                      alt={artist.name}
                      className="absolute inset-0 w-full h-full object-cover rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                    />
                    {/* 歌手卡片的播放按钮通常在右下角悬浮 */}
                    <button
                      onClick={() => smartRouter.push(`/arist?id=${artist.id}`)}
                      className="absolute bottom-1 right-1 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#1fdf64]"
                    >
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </button>
                  </div>
                  <h3 className="text-white font-bold truncate w-full mb-1">
                    {artist.name}
                  </h3>
                </div>
              ))}
            </div>
          </CollapsibleHomeSection>
        </section>

        {/* 新增区块 2: 最新发行 (常规方形卡片，副标题弱化) */}

        {isLogin && (
          <section>
            <CollapsibleHomeSection
              title={
                <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                  Your Collected Albums
                </h2>
              }
              collapsedHeight="280px" // 最新发行 1行的高度
            >
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {collectedAlbum.map((item: NeteaseUserAlbum) => (
                  <div
                    key={`new-${item.id}`}
                    className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group"
                  >
                    <div className="relative mb-4 pb-[100%]">
                      <img
                        src={item.picUrl}
                        alt="New Release"
                        className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                      />
                      <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#1fdf64]">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </button>
                    </div>
                    <h3 className="text-white font-bold truncate mb-1">
                      {item.name}
                    </h3>
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
