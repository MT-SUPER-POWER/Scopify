"use client";

import { Heart, MoreHorizontal, Pause, Play } from "lucide-react";
import type React from "react";
import type { Song } from "@/types/search";
import { cn } from "@/lib/utils";

/** ms → mm:ss */
function formatDuration(ms: number): string {
  if (!ms) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SongRow({
  song,
  isPlaying,
  onTogglePlay,
  onRowClick,
}: {
  song: Song;
  isPlaying: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  onRowClick?: () => void;
}) {
  const imageUrl =
    song.album?.picUrl ||
    song.artists?.[0]?.picUrl ||
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop";

  return (
    <div
      className="group flex items-center justify-between p-2.5 hover:bg-white/10 active:bg-white/5 rounded-md transition-colors cursor-pointer"
      onClick={onRowClick}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative w-11 h-11 shrink-0 bg-zinc-800 rounded">
          <img src={imageUrl} alt={song.name} className="w-full h-full object-cover rounded" />
          <div
            className={cn(
              "absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-opacity",
              isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <button
              onClick={onTogglePlay}
              className="text-white hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-base truncate font-medium",
              isPlaying ? "text-[#1ed760]" : "text-white",
            )}
          >
            {song.name}
          </span>
          <span className="text-sm text-zinc-400 group-hover:text-white transition-colors truncate">
            {song.artists?.map((a) => a.name).join(", ") || "Unknown Artist"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-zinc-400 shrink-0 ml-4">
        <Heart className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer hover:scale-110" />
        <span className="text-sm font-medium w-12 text-right tabular-nums">
          {formatDuration(song.duration)}
        </span>
        <MoreHorizontal className="w-5 h-5 opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer" />
      </div>
    </div>
  );
}
