"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn, getMainColorFromImage } from "@/lib/utils";
import TracklistTable from "@/components/Playlist/TrackTable";
import { useSearchParams } from "next/navigation";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getRecommendedSongs } from "@/lib/api/track";
import { usePlayerStore, useUserStore } from "@/store";
import { toast } from "sonner";
import PlaylistLoading from "./loading";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Play, Pause, MoreHorizontal, Shuffle, ArrowDownCircle, List, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colorCache = new Map<string, string>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 日历封面
const DailyCalendarCover = () => {
  const [dateInfo, setDateInfo] = useState({ dayOfWeek: '星期三', dateNum: 18 });

  useEffect(() => {
    const today = new Date();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    setDateInfo({ dayOfWeek: days[today.getDay()], dateNum: today.getDate() });
  }, []);

  return (
    <div className="w-full h-full shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10 shrink-0 flex flex-col rounded-md overflow-hidden bg-white select-none">
      <div className="h-[22%] bg-linear-to-b from-[#e34242] to-[#c42b2b] flex items-center justify-center border-b border-black/10">
        <span className="text-white text-lg md:text-xl font-medium tracking-widest">{dateInfo.dayOfWeek}</span>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-linear-to-b from-momo-light from-50% to-[#e6e6e6] to-50%">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/5 shadow-[0_1px_1px_rgba(255,255,255,0.8)] -translate-y-1/2" />
        <span className="text-7xl md:text-8xl font-black text-[#2a2a2a] font-sans z-10 tracking-tighter mt-2">{dateInfo.dateNum}</span>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistPage() {

  // 搜索控制区状态
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const clearAlbumList = useUserStore((s: any) => s.clearAlbumList);
  useEffect(() => {
    return () => { clearAlbumList(); };
  }, []);

  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");
  const isRecommend = searchParams.get("isRecommend") === "true";
  const isDailyRecommend = searchParams.get("isDailyRecommend") === "true";

  const [playlistDetail, setPlaylistDetail] = useState<any>(null);
  const [themeColor, setThemeColor] = useState<string>("from-[#88b325]");
  const [isLoading, setIsLoading] = useState(false);

  // 屏蔽掉不同数据源(每日推荐 vs 普通歌单)带来的字段差异
  const PLAYLIST_INFO = useMemo(() => {
    if (isDailyRecommend) {
      return {
        isSpecial: true,
        privacy: "Made For You",
        tags: ["Daily", "Recommendation"],
        title: "每日推荐",
        cover: null, // null 表示不使用图片，触发组件渲染
        createTime: new Date().toLocaleDateString(),
        // 每日推荐没有特定的 creator，使用当前系统登陆用户即可
        creator: "Spotify",
        creatorAvatar: "",
        likes: null,
        totalSongs: playlistDetail?.trackCount ?? 0,
      };
    }

    // 普通歌单逻辑
    return {
      isSpecial: false,
      privacy: playlistDetail?.privacy === 0 ? "Public Playlist" : playlistDetail?.privacy === 10 ? "Private Playlist" : "Unknown Privacy",
      tags: playlistDetail?.tags ?? [],
      title: playlistDetail?.name ?? "Unknown",
      cover: playlistDetail?.coverImgUrl ?? "https://pixabay.com/images/download/clker-free-vector-images-turntable-309662_1920.png",
      createTime: playlistDetail?.createTime ? new Date(playlistDetail.createTime).toLocaleDateString() : "Unknown Date",
      creator: playlistDetail?.creator?.nickname ?? "Unknown User",
      creatorAvatar: playlistDetail?.creator?.avatarUrl ?? "",
      likes: playlistDetail?.subscribedCount ?? 0,
      totalSongs: playlistDetail?.trackCount ?? 0,
    };
  }, [playlistDetail, isDailyRecommend]);

  // 主色调逻辑
  useEffect(() => {
    // 如果是每日推荐，直接给一个红色的默认主题（或者灰色）
    if (isDailyRecommend) {
      setThemeColor("#c42b2b");
      return;
    }

    if (playlistDetail?.coverImgUrl) {
      if (colorCache.has(playlistDetail.coverImgUrl)) {
        setThemeColor(colorCache.get(playlistDetail.coverImgUrl)!);
      } else {
        getMainColorFromImage(playlistDetail.coverImgUrl)
          .then((color) => {
            if (color) {
              colorCache.set(playlistDetail.coverImgUrl, color);
              setThemeColor(color);
            } else {
              setThemeColor("#88b325");
            }
          })
          .catch(() => setThemeColor("#88b325"));
      }
    }
  }, [playlistDetail?.coverImgUrl, isDailyRecommend]);

  // 拉取数据逻辑（拆分路由）
  useEffect(() => {
    // 如果既没有ID又不是每日推荐，直接退出
    if (!playlistId && !isDailyRecommend) return;

    setIsLoading(true);
    const cookie = typeof window !== 'undefined' ? localStorage.getItem("music_cookie") || "" : "";

    if (isDailyRecommend) {
      // 走每日推荐 API
      getRecommendedSongs()
        .then((res: any) => {
          // 根据你提供的 JSON 格式解析
          const dailySongs = res.data?.data?.dailySongs || [];

          // 构造一个简单的假歌单 detail 以复用逻辑
          setPlaylistDetail({
            name: "每日推荐",
            trackCount: dailySongs.length,
            tracks: dailySongs
          });

          // 写入全局播放列表
          useUserStore.getState().setAlbumList(dailySongs);
        })
        .catch((err: any) => {
          console.error("每日推荐请求失败:", err);
          toast.error("获取每日推荐失败");
        })
        .finally(() => setIsLoading(false));
    } else {
      // 走普通歌单 API
      getPlaylsitDetail({ id: playlistId as string, cookie: isRecommend ? cookie : undefined } as any)
        .then(res => {
          setPlaylistDetail(res.data.playlist);
          useUserStore.getState().setAlbumList(res.data.playlist.tracks || []);
        })
        .catch(error => {
          console.error("请求失败:", error);
          toast.error("获取歌单详情失败");
        })
        .finally(() => setIsLoading(false));
    }
  }, [playlistId, isDailyRecommend, isRecommend]);

  // 如果没有触发任何获取数据的条件
  if (!playlistId && !isDailyRecommend) return <div className="p-8 text-white">Invalid Playlist URL</div>;

  return (
    <div key={playlistId ?? "daily"} className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans">
      {/* 顶部背景渐变 */}
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)`
        }}
      />

      {/* Header 歌单信息 */}
      <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">

        {/* 左侧：固定大小的封面 */}
        <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02]
            shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md overflow-hidden bg-black/20">
          {isDailyRecommend ? (
            <DailyCalendarCover />
          ) : (
            <img
              src={PLAYLIST_INFO.cover!}
              alt={PLAYLIST_INFO.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 右侧：信息区，自上而下自然排布 */}
        <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">

          {/* 1. 标签区：自然占据顶部空间 */}
          <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
            <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
              {PLAYLIST_INFO.privacy}
            </span>
            {PLAYLIST_INFO.tags?.map((t: string, idx: number) => (
              <span key={idx} className="text-[12px] font-medium drop-shadow-md px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                {t}
              </span>
            ))}
          </div>

          {/* 2. 标题区：放弃过于激进的 clamp，使用稳定字号 + 紧凑行高 + 3行截断 */}
          <h1
            className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-4 md:mb-6 wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3"
            title={PLAYLIST_INFO.title}
          >
            {PLAYLIST_INFO.title}
          </h1>

          {/* 3. 元数据区：跟随标题自然往下顺延 */}
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
            {!PLAYLIST_INFO.isSpecial && (
              <>
                <div className="flex items-center gap-2 group cursor-pointer mr-1 text-white">
                  {PLAYLIST_INFO.creatorAvatar ? (
                    <img src={PLAYLIST_INFO.creatorAvatar} alt={PLAYLIST_INFO.creator} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold"> M </div>
                  )}
                  <span className="font-bold group-hover:underline text-[15px]">{PLAYLIST_INFO.creator}</span>
                </div>
                <span className="opacity-60 hidden sm:inline">•</span>
                <span>{PLAYLIST_INFO.createTime} 创建</span>
                <span className="opacity-60">•</span>
                <span>{Number(PLAYLIST_INFO.likes).toLocaleString()} 次收藏</span>
                <span className="opacity-60">•</span>
              </>
            )}
            <span className="font-medium text-white">共 {PLAYLIST_INFO.totalSongs} 首歌</span>
          </div>

        </div>
      </div>


      {/* 过渡遮罩层 */}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        {/* 动作栏 + 搜索控制区 */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-6">
            <button onClick={() => {
              const state = usePlayerStore.getState();
              state.setIsPlaying(!state.isPlaying);
            }}
              disabled={!usePlayerStore((s: any) => s.currentSongDetail)}
              className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {
                usePlayerStore((s: any) => s.isPlaying) ?
                  <Pause className="w-6 h-6 ml-0.5 fill-current" /> :
                  <Play className="w-6 h-6 ml-1.5 fill-current" />
              }
            </button>
            {/* 和 UI 状态同步 */}
            {usePlayerStore((s: any) => s.isShuffle) ?
              (
                <div className="relative inline-flex items-center justify-center cursor-pointer">
                  <Shuffle className={cn("w-8 h-8 text-[#1ed760] cursor-pointer")} />
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
                </div>
              ) :
              <Shuffle className="w-8 h-8 text-zinc-400 cursor-pointer" />}
            <ArrowDownCircle className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
            <MoreHorizontal className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
          </div>
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.div
                  key="search-input"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1 overflow-hidden"
                >
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent text-white text-xs outline-none w-full placeholder:text-zinc-500"
                  />
                  <button onClick={handleSearchClose}>
                    <X className="w-3 h-3 text-zinc-400 hover:text-white shrink-0" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.05, ease: "linear" }}
                  onClick={handleSearchOpen}
                >
                  <Search className="w-4 h-4 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">
              <span>List</span>
              <List className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="px-6 flex-1 pb-10 min-w-0 overflow-hidden">
          {isLoading ? <PlaylistLoading /> : (
            <TracklistTable
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={handleSearchOpen}
              onSearchClose={handleSearchClose}
              inputRef={inputRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}
