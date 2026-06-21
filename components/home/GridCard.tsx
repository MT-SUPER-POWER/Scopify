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
      className="group cursor-pointer rounded-md overflow-hidden bg-[#181818] hover:bg-[#282828] transition-colors p-4"
    >
      <div className="relative mb-4">
        <div
          className={cn(
            "w-full aspect-square rounded-md overflow-hidden bg-zinc-800 shadow-lg",
            isArtist && "rounded-full",
          )}
        >
          <Image
            width={200}
            height={200}
            src={coverUrl || ""}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            className="absolute bottom-2 right-2 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black
              opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-xl"
          >
            <Play className={cn("w-6 h-6 fill-current ml-0.5", isLoading && "animate-pulse")} />
          </button>
        )}
      </div>
      <h3 className="text-white text-sm font-bold truncate">{name}</h3>
      {subtitle && <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{subtitle}</p>}
      {playCount !== undefined && (
        <p className="text-zinc-400 text-xs mt-1">{formatPlayCount(playCount)} 次播放</p>
      )}
    </div>
  );
}
