"use client";

import { ArrowDownCircle, Heart, MoreHorizontal, Pause, Play, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumActionsProps {
  isPlaying: boolean;
  isAlbumCollected: boolean;
  isTogglingAlbumSubscribe: boolean;
  onPlay: () => void;
  onToggleSubscribe: () => void;
}

export function AlbumActions({ isPlaying, isAlbumCollected, isTogglingAlbumSubscribe, onPlay, onToggleSubscribe }: AlbumActionsProps) {
  return (
    <div className="flex items-center gap-6 px-6 py-6">
      <button type="button" onClick={onPlay}
        className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
        {isPlaying ? <Pause className="w-6 h-6 ml-0.5 fill-current" /> : <Play className="w-6 h-6 ml-1.5 fill-current" />}
      </button>
      <Shuffle className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
      <ArrowDownCircle className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
      <button type="button" disabled={isTogglingAlbumSubscribe} onClick={onToggleSubscribe}
        className="text-zinc-400 transition-colors hover:text-white disabled:opacity-50">
        <Heart className={cn("w-8 h-8", isAlbumCollected && "fill-[#1ed760] text-[#1ed760]")} />
      </button>
      <MoreHorizontal className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
    </div>
  );
}
