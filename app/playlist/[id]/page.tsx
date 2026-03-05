// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn } from "@/lib/utils";
import PlaylistTable from "@/components/Playlist/PlaylistTable";
import { Play, MoreHorizontal, Shuffle, ArrowDownCircle, UserPlus, List } from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MOCK DATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PLAYLIST_INFO = {
  type: "Public Playlist",
  title: "MIX",
  cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop",
  creator: "Momo and momo",
  creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
  likes: "1 like",
  totalSongs: "135 songs",
  duration: "About 8 hours",
  themeColor: "from-[#88b325]"
};

import TRACK_LIST from "@/assets/data/playlist_123.json";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistPage() {
  return (
    <div className="relative w-full min-h-full flex flex-col">

      {/* ==================== 顶部背景渐变 ==================== */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-80 bg-linear-to-b via-[#121212]/80 to-[#121212] z-0 pointer-events-none",
          PLAYLIST_INFO.themeColor,
        )}
      />


      {/* ==================== Header 歌单信息 ==================== */}
      <div className="relative z-10 flex items-end gap-6 px-6 pt-24 pb-6">
        {/* 封面图：带强烈阴影，截图中的尺寸稍大 */}
        <div className="w-48 h-48 lg:w-58 lg:h-58 shrink-0 shadow-[0_4px_60px_rgba(0,0,0,0.5)]">
          <img
            src={PLAYLIST_INFO.cover}
            alt="Playlist Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 文字信息 */}
        <div className="flex flex-col gap-2 text-white overflow-hidden pb-1">
          <span className="text-sm font-medium">{PLAYLIST_INFO.type}</span>
          {/* 截图中的标题非常巨大，使用 7xl/8xl 和紧凑字间距 */}
          {/* TODO: 可修改的 title */}
          <h1 className="text-7xl lg:text-[6rem] font-black tracking-tighter truncate py-1 leading-none mb-4">
            {PLAYLIST_INFO.title}
          </h1>

          <div className="flex items-center gap-1.5 text-sm font-medium mt-1 text-white/90">
            {/* 头像 + 联合创建者 */}
            <img
              src={PLAYLIST_INFO.creatorAvatar}
              alt={PLAYLIST_INFO.creator}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="font-bold text-white hover:underline cursor-pointer">{PLAYLIST_INFO.creator}</span>
            <span className="text-white/60">•</span>
            <span>{PLAYLIST_INFO.likes}</span>
            <span className="text-white/60">•</span>
            <span>{PLAYLIST_INFO.totalSongs}, {PLAYLIST_INFO.duration}</span>
          </div>
        </div>
      </div>

      {/* ==================== 渐变底色遮罩 ==================== */}
      {/* TODO: 透明遮罩层 */}
      <div className="bg-[#121212] w-full flex-1 relative z-10 flex flex-col">

        {/* ==================== 动作栏 (Action Bar) ==================== */}
        <div className="flex items-center justify-between px-6 py-6">
          {/* 左侧部分 */}
          <div className="flex items-center gap-6">
            <button className={cn(
              "bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full",
              "w-14 h-14 flex items-center justify-center shadow-lg"
            )}>
              <Play className="w-5 h-5 ml-1" fill="currentColor" />
            </button>
            {/* 截图新增：随机播放、下载、邀请、更多 */}
            <button className="text-[#1ed760] hover:text-[#3be477] transition-colors relative">
              <Shuffle className="w-8 h-8" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></div>
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <ArrowDownCircle className="w-8 h-8" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <UserPlus className="w-8 h-8" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-8 h-8" strokeWidth={1.5} />
            </button>
          </div>

          {/* 截图新增：右侧列表视图切换 */}
          <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">
            <span>List</span>
            <List className="w-5 h-5" />
          </div>
        </div>

        {/* ==================== 歌曲列表 (Tracklist) ==================== */}
        <div className="px-6 flex-1 pb-10">
          <PlaylistTable tracks={TRACK_LIST} />
        </div>

      </div>
    </div>
  );
}
