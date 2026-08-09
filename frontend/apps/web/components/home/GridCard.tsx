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
      className="bg-surface-elevated hover:bg-surface-overlay group cursor-pointer overflow-hidden rounded-md p-4 transition-colors"
    >
      <div className="relative mb-4">
        <div
          className={cn(
            "bg-surface-sunken shadow-panel aspect-square w-full overflow-hidden rounded-md",
            isArtist && "rounded-full",
          )}
        >
          <Image
            width={200}
            height={200}
            src={coverUrl || ""}
            alt={name}
            className="size-full object-cover"
          />
        </div>
        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover absolute right-2 bottom-2 flex size-12 translate-y-3 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105"
          >
            <Play className={cn("ml-0.5 size-6 fill-current", isLoading && "animate-pulse")} />
          </button>
        )}
        {playCount !== undefined && (
          <div className="bg-overlay/75 text-overlay-foreground shadow-panel pointer-events-none absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] opacity-0 backdrop-blur-sm transition-opacity duration-300 select-none group-hover:opacity-100">
            <Play className="size-2.5 fill-current" />
            <span>{formatPlayCount(playCount)}次播放</span>
          </div>
        )}
      </div>
      <h3 className="text-content truncate text-sm font-bold">{name}</h3>
      {subtitle && <p className="text-content-muted mt-1 line-clamp-2 text-xs">{subtitle}</p>}
    </div>
  );
}
