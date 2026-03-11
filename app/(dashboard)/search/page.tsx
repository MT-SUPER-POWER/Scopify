"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from "react";
import { Play, MoreHorizontal, Heart, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

// 样式合并工具函数

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MOCK DATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORIES = ["全部", "歌曲", "歌手", "歌单", "专辑", "播客", "用户"];

const TOP_RESULT = {
  id: "t1",
  type: "歌曲",
  title: "富士山下",
  artist: "陈奕迅",
  img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop",
};

const SONGS = [
  { id: "s1", title: "富士山下", artist: "陈奕迅", duration: "04:19", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop" },
  { id: "s2", title: "不如不见", artist: "陈奕迅", duration: "04:11", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop" },
  { id: "s3", title: "爱情转移", artist: "陈奕迅", duration: "04:21", img: "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=100&auto=format&fit=crop" },
  { id: "s4", title: "K歌之王", artist: "陈奕迅", duration: "03:45", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=100&auto=format&fit=crop" },
];

const ARTISTS = [
  { id: "a1", name: "陈奕迅", type: "歌手", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop" },
  { id: "a2", name: "周杰伦", type: "歌手", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop" },
  { id: "a3", name: "林俊杰", type: "歌手", img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop" },
  { id: "a4", name: "薛之谦", type: "歌手", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop" },
  { id: "a5", name: "王力宏", type: "歌手", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SearchResultsPage() {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [playingId, setPlayingId] = useState<string | null>(null);

  // TODO: 获取用户搜索用的 query 数据

  const togglePlay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className="w-full min-h-screen bg-[#121212] text-white p-6 overflow-y-auto pt-22">

      {/* 1. 顶部：Spotify 标志性的分类胶囊按钮 */}
      {/* TODO: 胶囊空间不够变可滚动 */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === category
                ? "bg-white text-black"
                : "bg-[#2a2a2a] text-white hover:bg-[#333333]"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 仅在“全部”分类下显示混合视图 */}
      {activeCategory === "全部" && (
        <>
          {/* 顶部两栏布局：最佳匹配 + 歌曲列表 */}
          <div className="flex flex-col xl:flex-row gap-6 mb-10">

            {/* 左侧：最佳匹配 (Top Result) */}
            <div className="xl:w-[40%] flex flex-col">
              <h2 className="text-2xl font-bold mb-4 tracking-tight">最佳匹配</h2>
              <div className="relative group bg-[#181818] hover:bg-[#282828] transition-colors rounded-lg p-5 flex-1 cursor-pointer">
                <div className="w-24 h-24 mb-5 shadow-lg">
                  <img
                    src={TOP_RESULT.img}
                    alt={TOP_RESULT.title}
                    className={cn("w-full h-full object-cover", TOP_RESULT.type === "歌手" ? "rounded-full" : "rounded-md")}
                  />
                </div>
                <h3 className="text-3xl font-bold mb-1 truncate">{TOP_RESULT.title}</h3>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-white hover:underline">{TOP_RESULT.artist}</span>
                  <span className="px-2 py-0.5 bg-[#121212] rounded-full text-[11px] font-bold tracking-wide uppercase">
                    {TOP_RESULT.type}
                  </span>
                </div>

                {/* 悬浮播放按钮：增加了阴影和稍微偏右下的位置以符合原版 */}
                <button
                  onClick={(e) => togglePlay(TOP_RESULT.id, e)}
                  className="absolute bottom-5 right-5 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-[0_8px_8px_rgba(0,0,0,0.3)]"
                >
                  {playingId === TOP_RESULT.id ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
              </div>
            </div>

            {/* 右侧：歌曲列表 (Songs) */}
            <div className="xl:w-[60%] flex flex-col">
              {/* 2. 增加“查看全部”按钮的标题栏 */}
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">歌曲</h2>
                <button className="text-sm font-bold text-zinc-400 hover:text-white hover:underline">
                  查看全部
                </button>
              </div>

              <div className="flex flex-col">
                {SONGS.map((song) => (
                  <div
                    key={song.id}
                    className="group flex items-center justify-between p-2 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* 图片与播放遮罩 */}
                      <div className="relative w-10 h-10 shrink-0">
                        <img src={song.img} alt={song.title} className="w-full h-full object-cover rounded" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                          <button onClick={(e) => togglePlay(song.id, e)} className="text-white">
                            {playingId === song.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                        </div>
                      </div>
                      {/* 歌曲信息 */}
                      <div className="flex flex-col">
                        <span className={cn("text-base truncate", playingId === song.id ? "text-[#1ed760]" : "text-white")}>
                          {song.title}
                        </span>
                        <span className="text-sm text-zinc-400 hover:text-white hover:underline transition-colors truncate">
                          {song.artist}
                        </span>
                      </div>
                    </div>

                    {/* 右侧操作区 */}
                    <div className="flex items-center gap-4 text-zinc-400">
                      <Heart className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer" />
                      <span className="text-sm font-medium w-10 text-right">{song.duration}</span>
                      <MoreHorizontal className="w-5 h-5 opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 下方网格区：相关歌手/专辑等 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 tracking-tight">歌手</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {ARTISTS.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group relative"
                >
                  <div className="w-full aspect-square mb-4 shadow-lg overflow-hidden rounded-full">
                    <img src={artist.img} alt={artist.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-base font-bold truncate mb-1">{artist.name}</h4>
                  <p className="text-sm text-zinc-400 capitalize">{artist.type}</p>

                  {/* 悬浮播放按钮：网格项同样需要 */}
                  <button className="absolute bottom-20 right-4 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-[0_8px_8px_rgba(0,0,0,0.3)] z-10">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 点击其他分类（如"歌曲"）时的空状态展示，工程中通常这里会替换为对应的列表组件 */}
      {activeCategory !== "全部" && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <p>此处将显示与“{activeCategory}”相关的详细列表...</p>
        </div>
      )}

    </div>
  );
}
