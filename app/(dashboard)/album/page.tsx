"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn, getMainColorFromImage } from "@/lib/utils";
import TracklistTable from "@/components/Playlist/TrackTable"; // 复用你的歌曲列表组件
import { useSearchParams } from "next/navigation";
import { getAlbumDetail } from "@/lib/api/album"; // 假设你在这个路径下有获取专辑的 API
import { usePlayerStore, useUserStore } from "@/store";
import { toast } from "sonner";
import PlaylistLoading from "@/app/(dashboard)/playlist/loading"; // 复用你的 Loading 骨架屏
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Play, Pause, MoreHorizontal, Shuffle, ArrowDownCircle, List, Search, X, Disc3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colorCache = new Map<string, string>();
const COLOR_CACHE_LIMIT = 10;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setColorCache(key: string, value: string) {
  if (colorCache.size >= COLOR_CACHE_LIMIT) {
    colorCache.delete(colorCache.keys().next().value!);
  }
  colorCache.set(key, value);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AlbumPage() {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 搜索控制区状态
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Player store selectors (extract to consts to keep hook order stable)
  const isPlaying = usePlayerStore((s: any) => s.isPlaying);
  const isShuffle = usePlayerStore((s: any) => s.isShuffle);
  const searchParams = useSearchParams();
  const albumId = searchParams.get("id");

  // 数据状态
  const [albumDetail, setAlbumDetail] = useState<any>(null);
  const [themeColor, setThemeColor] = useState<string>("from-[#88b325]");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  const togglePlay = useCallback(() => {
    const state = usePlayerStore.getState();
    const songs = useUserStore.getState().albumList;
    if (!songs.length) return;
    const isCurrentQueue = state.queue.length === songs.length && state.queue[0]?.id === songs[0]?.id;
    if (isCurrentQueue) {
      state.setIsPlaying(!state.isPlaying);
    } else {
      state.setQueue(songs, 0);
      state.playQueueIndex(0);
    }
  }, []);

  // 专辑信息说明
  const ALBUM_INFO = useMemo(() => {
    if (!albumDetail) return null;

    const album = albumDetail.album;
    const artist = album.artist || album.artists?.[0]; // 兼容单个或多个 artist 字段
    const releaseYear = album.publishTime ? new Date(album.publishTime).toISOString().slice(0, 10) : "Unknown Year";

    return {
      type: album.type || "Album", // 例如: "专辑", "EP"
      subType: album.subType,      // 例如: "录音室版"
      title: album.name ?? "Unknown Album",
      cover: album.picUrl ?? `https://picsum.photos/300/300?random=${Math.random()}`,
      releaseYear: releaseYear,
      artistName: artist?.name ?? "Unknown Artist",
      artistAvatar: artist?.picUrl || artist?.img1v1Url || "",
      company: album.company ?? "",
      totalSongs: album.size ?? 0,
      description: album.description ?? ""
    };
  }, [albumDetail]);

  // 主色调逻辑提取
  useEffect(() => {
    if (ALBUM_INFO?.cover) {
      if (colorCache.has(ALBUM_INFO.cover)) {
        setThemeColor(colorCache.get(ALBUM_INFO.cover)!);
      } else {
        getMainColorFromImage(ALBUM_INFO.cover)
          .then((color) => {
            if (color) {
              setColorCache(ALBUM_INFO.cover, color);
              setThemeColor(color);
            } else {
              setThemeColor("#88b325"); // 默认色
            }
          })
          .catch(() => setThemeColor("#88b325"));
      }
    }
  }, [ALBUM_INFO?.cover]);

  // 拉取数据逻辑
  useEffect(() => {
    if (!albumId) return;

    setIsLoading(true);
    setIsError(false);
    getAlbumDetail(albumId as string)
      .then((res: any) => {
        if (!res.data.album || !res.data.songs) { setIsError(true); return; }
        setAlbumDetail(res.data);

        // 拿到的歌曲数据是没有专属歌曲页面的，所以在专辑页面我们把专辑封面图直接放在歌曲数据里，方便后续 TrackTable 组件调用显示
        const songs_with_album_pic = res.data.songs.map((song: any) => {
          return {
            ...song,
            al: {
              ...song.al,
              picUrl: ALBUM_INFO?.cover
            }
          };
        });
        // console.log("专辑详情和歌曲列表获取成功:", songs_with_album_pic);
        useUserStore.getState().setAlbumList(songs_with_album_pic || []);
      })
      .catch((error: any) => {
        console.error("请求专辑失败:", error);
        setIsError(true);
        toast.error("获取专辑详情失败");
      })
      .finally(() => setIsLoading(false));
  }, [albumId, ALBUM_INFO?.cover]);

  if (!albumId) return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#121212] text-zinc-400 gap-4">
      <Disc3 className="w-16 h-16 opacity-30" />
      <span className="text-lg font-medium tracking-wider">未提供专辑 ID</span>
    </div>
  );

  if (isLoading && !albumDetail) return (
    <div className="w-full min-h-screen bg-[#121212] px-6 py-24">
      <PlaylistLoading />
    </div>
  );

  if (isError || (!isLoading && !albumDetail)) return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#121212] text-zinc-400 gap-4">
      <Disc3 className="w-16 h-16 opacity-30" />
      <span className="text-lg font-medium tracking-wider">获取专辑信息失败或专辑不存在</span>
    </div>
  );

  return (
    <div key={albumId} className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans">
      {/* 顶部背景渐变 */}
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60 transition-colors duration-700"
        style={{
          background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)`
        }}
      />

      {/* Header 专辑信息 */}
      <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">

        {/* 左侧：固定大小的封面 */}
        <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02]
            shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md overflow-hidden bg-black/20">
          <img
            src={ALBUM_INFO?.cover || "https://pixabay.com/images/download/clker-free-vector-images-turntable-309662_1920.png"}
            alt={ALBUM_INFO?.title || "Album Cover"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 右侧：信息区 */}
        <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">

          {/* 1. 标签区：与 playlist 统一，带背景 pill */}
          <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
            <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
              {ALBUM_INFO?.type || "Album"}
            </span>
            {ALBUM_INFO?.subType && (
              <span className="text-[12px] font-medium drop-shadow-md px-3 py-1 bg-white/10 rounded-full">
                {ALBUM_INFO.subType}
              </span>
            )}
          </div>

          {/* 2. 标题区 */}
          <h1
            className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-4 md:mb-6 wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3"
            title={ALBUM_INFO?.title}
          >
            {ALBUM_INFO?.title}
          </h1>

          {/* 3. 描述（可选） */}
          {ALBUM_INFO?.description && (
            <p className="text-sm text-white/70 drop-shadow-md mb-4 line-clamp-2 font-normal max-w-2xl leading-relaxed">
              {ALBUM_INFO.description}
            </p>
          )}

          {/* 4. 元数据区：与 playlist 统一风格 */}
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
            <div className="flex items-center gap-2 group cursor-pointer mr-1 text-white">
              {ALBUM_INFO?.artistAvatar ? (
                <img src={ALBUM_INFO.artistAvatar} alt={ALBUM_INFO.artistName} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold">
                  {ALBUM_INFO?.artistName?.charAt(0) || "A"}
                </div>
              )}
              <span className="font-bold group-hover:underline text-[15px]">{ALBUM_INFO?.artistName}</span>
            </div>
            <span className="opacity-60 hidden sm:inline">•</span>
            <span>{ALBUM_INFO?.releaseYear}</span>
            <span className="opacity-60">•</span>
            <span className="font-medium text-white">{ALBUM_INFO?.totalSongs} 首歌</span>
          </div>
        </div>
      </div>

      {/* 过渡遮罩层 */}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        {/* 动作栏 + 搜索控制区 */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-6">
            <button
              onClick={togglePlay}
              className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all
               text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
            >
              {isPlaying ?
                <Pause className="w-6 h-6 ml-0.5 fill-current" /> :
                <Play className="w-6 h-6 ml-1.5 fill-current" />
              }
            </button>

            {isShuffle ? (
              <div className="relative inline-flex items-center justify-center cursor-pointer">
                <Shuffle className={cn("w-8 h-8 text-[#1ed760] cursor-pointer")} />
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
              </div>
            ) : (
              <Shuffle className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
            )}

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
                    placeholder="Search in album..."
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
            <>
              <TracklistTable
                searchOpen={searchOpen}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchOpen={handleSearchOpen}
                onSearchClose={handleSearchClose}
                inputRef={inputRef}
              />

              {ALBUM_INFO?.company && (
                <div className="mt-8 text-xs text-zinc-500 px-4">
                  © {ALBUM_INFO.releaseYear} {ALBUM_INFO.company}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
