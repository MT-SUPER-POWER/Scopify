"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import TracklistTable from "@/components/Playlist/TrackTable";
import { useUserStore } from "@/store";
import PlaylistLoading from "./loading";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePlaylist } from "@/components/Playlist/hook/usePlaylistData";
import PlaylistHeader from "@components/Playlist/Header";
import PlaylistActions from "@/components/Playlist/ActionStation";
import PlaylistHeaderSkeleton from "./_components/HeaderSkeleton";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistPage() {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTATNTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 搜索控制区状态
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { playlistId, isDailyRecommend, isLoading, playlistInfo, themeColor } = usePlaylist();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // console.log("Test Render or not from PlaylistPage");

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const clearAlbumList = useUserStore((s) => s.clearAlbumList);
  useEffect(() => {
    return () => { clearAlbumList(); };
  }, [clearAlbumList]);

  // 如果没有触发任何获取数据的条件
  if (!playlistId && !isDailyRecommend) return <div className="p-8 text-white">Invalid Playlist URL</div>;

  return (
    <div key={playlistId ?? "daily"} className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans">
      {/* 顶部背景渐变 */}
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
      />

      {/* 头部组件：传递 info 进去渲染 */}
      {playlistInfo && <PlaylistHeader info={playlistInfo} isDaily={isDailyRecommend} />}

      {/* 过渡遮罩层 */}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">

        {/* 抽象出的交互操作栏 */}
        {isLoading ? <PlaylistHeaderSkeleton />
          : (
            <PlaylistActions
              playlistId={playlistId}
              isDaily={isDailyRecommend}
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={handleSearchOpen}
              onSearchClose={handleSearchClose}
              inputRef={inputRef}
            />
          )}

        {/* 歌曲列表 */}
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
