"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn, getMainColorFromImage } from "@/lib/utils";
import TracklistTable from "@/components/Playlist/TrackTable";
import { Pause, Search, X } from "lucide-react";
import { Play, MoreHorizontal, Shuffle, ArrowDownCircle, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { getPlaylistAllTracks, getUserLikeLists } from "@/lib/api/playlist";
import { usePlayerStore, useUserStore } from "@/store";
import { toast } from "sonner";
import React from "react";
import PlaylistLoading from "./loading";
import { motion, AnimatePresence } from "framer-motion";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 主色调缓存，避免重复计算
const colorCache = new Map<string, string>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistPage() {

  // 搜索控制区状态
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 必须使用 useCallback 缓存函数，否则每次父组件重渲染都会生成新函数，
  // 导致子组件的 React.memo 完全失效。
  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");

  const playlistList = useUserStore((state) => state.playlist);

  const playlistInfo = React.useMemo(
    () => playlistList.find(p => String(p.id) === playlistId),
    [playlistList, playlistId]
  );
  const [themeColor, setThemeColor] = useState<string>("from-[#88b325]");
  const [isLoading, setIsLoading] = useState(false);

  const PLAYLIST_INFO = React.useMemo(() => {
    return {
      privacy: playlistInfo?.privacy === 0 ? "Public Playlist" : playlistInfo?.privacy === 10 ? "Private Playlist" : "Unknown Privacy",
      tags: playlistInfo?.tags ?? [],
      title: playlistInfo?.name ?? "Unknown",
      cover: playlistInfo?.coverImgUrl ?? "http://p1.music.126.net/TejtjOPxrSfHcUwT6hT73A==/109951168975571761.jpg",
      createTime: playlistInfo?.createTime ? new Date(playlistInfo.createTime).toLocaleDateString() : "Unknown Date",
      creator: playlistInfo?.creator.nickname ?? "Unknown User",
      creatorAvatar: playlistInfo?.creator.avatarUrl ?? "https://p4.music.126.net/D9NeJsmZ4C81zNdsFKgI7Q==/109951170297494630.jpg",
      likes: playlistInfo?.subscribedCount ?? 0,
      totalSongs: playlistInfo?.trackCount ?? 0,
    };
  }, [playlistInfo]);

  // 异步获取主色调
  useEffect(() => {
    if (playlistInfo?.coverImgUrl) {
      if (colorCache.has(playlistInfo.coverImgUrl)) {
        setThemeColor(colorCache.get(playlistInfo.coverImgUrl)!);
      } else {
        getMainColorFromImage(playlistInfo.coverImgUrl)
          .then((color) => {
            if (color) {
              colorCache.set(playlistInfo.coverImgUrl, color);
              setThemeColor(color);
            } else {
              setThemeColor("#88b325");
            }
          })
          .catch(() => {
            setThemeColor("#88b325");
          });
      }
    }
  }, [playlistInfo?.coverImgUrl]);

  // 请求这个歌曲列表的歌曲信息和喜欢
  useEffect(() => {
    if (!playlistId) return;

    setIsLoading(true);

    const uid = useUserStore.getState().user?.userId;

    Promise.all([
      getPlaylistAllTracks(playlistId),
      getUserLikeLists(uid!),
    ])
      .then(([tracks, likeLists]) => {
        useUserStore.getState().setAlbumList(tracks.data.songs);
        useUserStore.getState().setLikeListIDs(likeLists.data.ids); // Set<number>
      })
      .catch((error) => {
        console.error("请求失败:", error);
        toast.error("获取数据失败，请稍后再试");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [playlistId]);

  if (!playlistId) return <div>Invalid Playlist ID</div>;

  return (
    <div className="relative w-full min-h-full flex flex-col bg-[#121212]">
      {/* 顶部背景渐变 */}
      <div
        className="absolute top-0 left-0 right-0 h-145 z-0 pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 60%)`
        }}
      />

      {/* Header 歌单信息 */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 px-6 pt-24 pb-6">
        <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.02]">
          <img
            src={PLAYLIST_INFO.cover}
            alt={PLAYLIST_INFO.title}
            className="w-full h-full object-cover rounded-sm"
          />
        </div>

        <div className="flex flex-col gap-2 text-white overflow-hidden pb-1 mt-4 md:mt-0 flex-1 min-w-0">
          <div className="flex flex-row gap-2 flex-wrap items-center">
            <span className="text-sm font-bold drop-shadow-md hidden md:block">
              {PLAYLIST_INFO.privacy}
            </span>
            {PLAYLIST_INFO.tags && PLAYLIST_INFO.tags.length > 0 ? (
              PLAYLIST_INFO.tags.map((t, idx) => (
                <span key={idx} className="text-[12px] font-medium drop-shadow-md hidden md:inline-block px-3 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500 hidden md:block">No tags</span>
            )}
          </div>
          <h1 className="font-black tracking-tighter leading-tight truncate drop-shadow-lg mb-2 md:mb-4 text-[clamp(1.8rem,3.5vw,3.5rem)]">
            {PLAYLIST_INFO.title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/90 drop-shadow-md">
            <div className="flex items-center gap-1.5 group cursor-pointer mr-1">
              <img src={PLAYLIST_INFO.creatorAvatar} alt={PLAYLIST_INFO.creator} className="w-6 h-6 rounded-full object-cover" />
              <span className="font-bold group-hover:underline">{PLAYLIST_INFO.creator}</span>
            </div>
            <span className="opacity-60 hidden sm:inline">•</span>
            <span className="opacity-80">{PLAYLIST_INFO.createTime} 创建</span>
            <span className="opacity-60">•</span>
            <span className="opacity-80">{Number(PLAYLIST_INFO.likes).toLocaleString()} 次收藏</span>
            <span className="opacity-60">•</span>
            <span className="opacity-80 font-medium">共 {PLAYLIST_INFO.totalSongs} 首歌</span>
          </div>
        </div>
      </div>

      {/* 过渡遮罩层 */}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/40 via-[#121212] to-[#121212] via-15%">
        {/* 动作栏 + 搜索控制区 */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-6">
            <button onClick={() => usePlayerStore.getState().setIsPlaying(!usePlayerStore.getState().isPlaying)}
              disabled={!usePlayerStore(s => s.currentSongDetail)}
              className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {
                usePlayerStore(s => s.isPlaying) ?
                  <Pause className="w-5 h-5 ml-1" fill="currentColor" /> :
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
              }
            </button>
            {/* 和 UI 状态同步 */}
            {usePlayerStore(s => s.isShuffle) ?
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

            {/* TODO: 按照某种指定的顺序排列歌单 */}
            <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">
              <span>List</span>
              <List className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="px-6 flex-1 pb-10">
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
