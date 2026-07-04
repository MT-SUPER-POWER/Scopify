"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { cn, formatPlayCount } from "@/lib/utils";

interface GridCardProps {
  id: string | number;
  name: string;
  coverUrl?: string;
  subtitle?: string;
  playCount?: number;
  isLoading?: boolean;
  isArtist?: boolean;
  onPlay?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export function GridCard({
  id,
  name,
  coverUrl,
  subtitle,
  playCount,
  isLoading,
  isArtist,
  onPlay,
  onClick,
}: GridCardProps) {
  return (
    <div
      key={id}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-md bg-[#181818] p-4 transition-colors hover:bg-[#282828]"
    >
      <div className="relative mb-4">
        <div
          className={cn(
            "aspect-square w-full overflow-hidden rounded-md bg-zinc-800 shadow-lg",
            isArtist && "rounded-full",
          )}
        >
          <Image
            width={200}
            height={200}
            src={coverUrl || ""}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            className="absolute right-2 bottom-2 flex h-12 w-12 translate-y-3 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-[#3be477]"
          >
            <Play className={cn("ml-0.5 h-6 w-6 fill-current", isLoading && "animate-pulse")} />
          </button>
        )}
        {playCount !== undefined && (
          <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-300 select-none group-hover:opacity-100">
            <Play className="h-2.5 w-2.5 fill-current text-white" />
            <span>{formatPlayCount(playCount)}次播放</span>
          </div>
        )}
      </div>
      <h3 className="truncate text-sm font-bold text-white">{name}</h3>
      {subtitle && <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{subtitle}</p>}
    </div>
  );
}
