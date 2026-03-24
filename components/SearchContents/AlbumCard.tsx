"use client";

import React from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Album } from '@/app/(dashboard)/search/_types';

export function AlbumCard({
  album,
  isPlaying,
  isLoading,
  onTogglePlay,
  onClick,
}: {
  album: Album;
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
      <div className="w-full aspect-square mb-4 shadow-lg overflow-hidden rounded-md bg-zinc-800">
        <Image
          src={album.picUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop"}
          alt={album.name}
          className="w-full h-full object-cover"
          width={300} height={300}
        />
      </div>
      <h4 className="text-base font-bold truncate mb-1">{album.name}</h4>
      <p className="text-sm text-zinc-400 truncate mt-1">
        {new Date(album.publishTime).getFullYear()} • {album.artist?.name || "Unknown Artist"}
      </p>

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
