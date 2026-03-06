// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { cn } from "@/lib/utils";
import PlaylistTable from "@/components/Playlist/PlaylistTable";
import { Play, MoreHorizontal, Shuffle, ArrowDownCircle, UserPlus, List } from "lucide-react";

const PLAYLIST_INFO = {
  type: "Public Playlist",
  title: "MIX",
  cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop",
  creator: "Momo and momo",
  creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
  likes: "1 like",
  totalSongs: "135 songs",
  duration: "About 8 hours",
  themeColor: "from-[#88b325]" // 顶部主题色
};

import TRACK_LIST from "@/assets/data/playlist_123.json";

export default function PlaylistPage() {
  return (
    <div className="relative w-full min-h-full flex flex-col bg-[#121212]">

      {/* ==================== 顶部背景渐变 ==================== */}
      {/* 增加高度并调整透明度，形成沉浸感 */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[500px] bg-linear-to-b to-transparent z-0 pointer-events-none opacity-60",
          PLAYLIST_INFO.themeColor,
        )}
      />

      {/* ==================== Header 歌单信息 ==================== */}
      <div className="relative z-10 flex items-end gap-6 px-6 pt-24 pb-6">
        <div className="w-48 h-48 lg:w-58 lg:h-58 shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-all">
          <img src={PLAYLIST_INFO.cover} alt="Cover" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-2 text-white overflow-hidden pb-1">
          <span className="text-sm font-bold">{PLAYLIST_INFO.type}</span>
          <h1 className="text-7xl lg:text-[6rem] font-black tracking-tighter truncate leading-none mb-4">
            {PLAYLIST_INFO.title}
          </h1>
          <div className="flex items-center gap-1.5 text-sm font-bold text-white/90">
            <img src={PLAYLIST_INFO.creatorAvatar} className="w-6 h-6 rounded-full" />
            <span className="hover:underline cursor-pointer">{PLAYLIST_INFO.creator}</span>
            <span className="opacity-60">• {PLAYLIST_INFO.likes} • {PLAYLIST_INFO.totalSongs}, {PLAYLIST_INFO.duration}</span>
          </div>
        </div>
      </div>

      {/* ==================== 关键：过渡遮罩层 ==================== */}
      {/* 使用 bg-linear-to-b 从半透明黑过渡到纯黑，营造“颜色下沉”的效果 */}
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
        <div className="px-6 flex-1 pb-10">
          <PlaylistTable tracks={TRACK_LIST} />
        </div>
      </div>
    </div>
  );
}
