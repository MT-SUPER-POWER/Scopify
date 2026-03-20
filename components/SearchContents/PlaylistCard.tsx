"use client";

import React from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Playlist } from "@/app/(dashboard)/search/page";

/** 格式化播放量 (例如 123456 -> 123.5K) */
function formatCount(count: number): string {
  if (!count) return "0";
  if (count > 1000000000) return (count / 1000000000).toFixed(1) + "B";
  if (count > 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count > 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export function PlaylistCard({
  playlist,
  isPlaying,
  isLoading,
  onTogglePlay,
  onClick,
}: {
  playlist: Playlist;
  isPlaying: boolean;
  isLoading?: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  return (
    <div
      className="bg-[#181818] hover:bg-[#282828] active:bg-[#202020] transition-colors p-4 rounded-xl cursor-pointer group relative"
      onClick={onClick}
    >
      <div className="w-full aspect-square mb-4 shadow-lg overflow-hidden rounded-md bg-zinc-800 relative">
        <img src={playlist.coverImgUrl} alt={playlist.name} className="w-full h-full object-cover" />
        {playlist.playCount > 0 && (
          <div className="absolute top-1 right-2 bg-black/60 px-2 py-0.5 rounded text-[11px] font-bold">
            ▷ {formatCount(playlist.playCount)}
          </div>
        )}
      </div>
      <h4 className="text-base font-bold truncate mb-1">{playlist.name}</h4>
      <p className="text-sm text-zinc-400 truncate mt-1">By {playlist.creator?.nickname || "NetEase User"}</p>

      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(e); }}
        disabled={isLoading}
        className={cn(
          "absolute bottom-20 right-6 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-[0_8px_8px_rgba(0,0,0,0.3)] z-10 disabled:opacity-80 disabled:hover:scale-100",
          isPlaying || isLoading ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0"
        )}
      >
        {isLoading
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : isPlaying
          ? <Pause className="w-6 h-6 fill-current" />
          : <Play className="w-6 h-6 fill-current ml-1" />}
      </button>
    </div>
  );
}
