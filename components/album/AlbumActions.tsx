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

export function AlbumActions({
  isPlaying,
  isAlbumCollected,
  isTogglingAlbumSubscribe,
  onPlay,
  onToggleSubscribe,
}: AlbumActionsProps) {
  return (
    <div className="flex items-center gap-6 p-6">
      <button
        type="button"
        onClick={onPlay}
        className="flex size-14 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-lg transition-all hover:scale-105 hover:bg-[#3be477]"
      >
        {isPlaying ? (
          <Pause className="ml-0.5 size-6 fill-current" />
        ) : (
          <Play className="ml-1.5 size-6 fill-current" />
        )}
      </button>
      <Shuffle className="size-8 cursor-pointer text-zinc-400 transition-colors hover:text-white" />
      <ArrowDownCircle className="size-8 cursor-pointer text-zinc-400 transition-colors hover:text-white" />
      <button
        type="button"
        disabled={isTogglingAlbumSubscribe}
        onClick={onToggleSubscribe}
        className="text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
      >
        <Heart className={cn("size-8", isAlbumCollected && "fill-[#1ed760] text-[#1ed760]")} />
      </button>
      <MoreHorizontal className="size-8 cursor-pointer text-zinc-400 transition-colors hover:text-white" />
    </div>
  );
}
