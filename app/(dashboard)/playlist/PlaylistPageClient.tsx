"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn, getMainColorFromImage } from "@/lib/utils";
import TracklistTable from "@/components/Playlist/TrackTable";
import { Play, MoreHorizontal, Shuffle, ArrowDownCircle, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { useUserStore } from "@/store";
import { toast } from "sonner";
import React from "react";

// 主色调缓存，避免重复计算
const colorCache = new Map<string, string>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistPageClient() {

  // NOTE: 静态页面拿到 query 参数的方式
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");

  const playlistList = useUserStore((state) => state.playlist);

  const playlistInfo = React.useMemo(
    () => playlistList.find(p => String(p.id) === playlistId),
    [playlistList, playlistId]
  );
  const [themeColor, setThemeColor] = useState<string>("from-[#88b325]");

  const PLAYLIST_INFO = React.useMemo(() => {
    return {
      privacy: playlistInfo?.privacy === 0 ? "Public Playlist" : playlistInfo?.privacy === 10 ? "Private Playlist" : "Unknown Privacy",
      tags: playlistInfo?.tags ?? [],
      title: playlistInfo?.name ?? "Unknown",
      cover: playlistInfo?.coverImgUrl ?? "/default-cover.png",
      createTime: playlistInfo?.createTime ? new Date(playlistInfo.createTime).toLocaleDateString() : "Unknown Date",
      creator: playlistInfo?.creator.nickname ?? "Unknown User",
      creatorAvatar: playlistInfo?.creator.avatarUrl ?? "/default-avatar.png",
      likes: playlistInfo?.subscribedCount ?? 0,
      totalSongs: playlistInfo?.trackCount ?? 0,
    };
  }, [playlistInfo]);

  // 异步获取主色调
  useEffect(() => {
    if (playlistInfo?.coverImgUrl) {
      // 优先用缓存
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

  // 请求这个歌曲列表的专辑
  useEffect(() => {
    if (playlistId) {
      getPlaylistAllTracks(playlistId).then((tracks) => {
        useUserStore.getState().setAlbumList(tracks.data.songs)
      }).catch((error) => {
        console.error("获取歌曲列表失败:", error);
        toast.error("获取歌曲列表失败，请稍后再试");
      });
    }
  }, [playlistId]);

  if (!playlistId) return <div>Invalid Playlist ID</div>;

  return (
    <div className="relative w-full min-h-full flex flex-col bg-[#121212]">

      {/* ==================== 顶部背景渐变 ==================== */}
      <div
        className="absolute top-0 left-0 right-0 h-145 z-0 pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 60%)`
        }}
      />

      {/* ==================== Header 歌单信息 ==================== */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 px-6 pt-24 pb-6">

        {/* 封面图 */}
        <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.02]">
          <img
            src={PLAYLIST_INFO.cover}
            alt={PLAYLIST_INFO.title}
            className="w-full h-full object-cover rounded-sm"
          />
        </div>

        {/* 文本信息区 */}
        <div className="flex flex-col gap-2 text-white overflow-hidden pb-1 mt-4 md:mt-0">
          {/* privacy +  Tag */}
          <div className="flex flex-row gap-2 flex-wrap items-center">
            <span className="text-sm font-bold drop-shadow-md hidden md:block">
              {PLAYLIST_INFO.privacy}
            </span>

            {PLAYLIST_INFO.tags && PLAYLIST_INFO.tags.length > 0 ? (
              PLAYLIST_INFO.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[12px] font-medium drop-shadow-md hidden md:inline-block px-3 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500 hidden md:block">No tags</span>
            )}
          </div>

          {/* 标题 */}
          <h1 className="font-black tracking-tighter leading-tight line-clamp-2 wrap-break-word drop-shadow-lg mb-2 md:mb-4 text-[clamp(2.5rem,5vw,6rem)]">
            {PLAYLIST_INFO.title}
          </h1>

          {/* 数据统计区 */}
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/90 drop-shadow-md">
            {/* 作者信息 */}
            <div className="flex items-center gap-1.5 group cursor-pointer mr-1">
              <img
                src={PLAYLIST_INFO.creatorAvatar}
                alt={PLAYLIST_INFO.creator}
                className="w-6 h-6 rounded-full object-cover"
              />
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

      {/* ==================== 过渡遮罩层 ==================== */}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/40 via-[#121212] to-[#121212] via-15%">

        {/* 动作栏 */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-6">
            <button className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 ml-1" fill="currentColor" />
            </button>
            <Shuffle className="w-8 h-8 text-[#1ed760] cursor-pointer" />
            <ArrowDownCircle className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
            <MoreHorizontal className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">
            <span>List</span>
            <List className="w-5 h-5" />
          </div>
        </div>

        {/* 歌曲列表 */}
        <div className="px-6 flex-1 pb-10"> <TracklistTable /> </div>
      </div>
    </div>
  );
}
