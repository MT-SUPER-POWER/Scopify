"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { cn, formatPlayCount } from "@/lib/utils";

import type { GridCardProps } from "@/types/components/home";

export function GridCard({
  id,
  name,
  coverUrl,
  subtitle,
  playCount,
  isLoading,
  isArtist,
  appearance = "default",
  onPlay,
  onClick,
}: GridCardProps) {
  return (
    <div
      key={id}
      data-section-item
      onClick={onClick}
      className={cn(
        "group min-w-0 cursor-pointer overflow-hidden rounded-md transition-colors hover:bg-surface-overlay",
        appearance === "home" ? "bg-transparent p-2" : "bg-surface-elevated p-4",
      )}
    >
      <div className={cn("relative", appearance === "home" ? "mb-3" : "mb-4")}>
        <div
          className={cn(
            "aspect-square w-full overflow-hidden rounded-md bg-surface-sunken shadow-panel",
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
            className="absolute right-2 bottom-2 flex size-12 translate-y-3 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
          >
            <Play className={cn("ml-0.5 size-6 fill-current", isLoading && "animate-pulse")} />
          </button>
        )}
        {playCount !== undefined && (
          <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 rounded-full bg-overlay/75 px-2 py-0.5 text-[11px] text-overlay-foreground opacity-0 shadow-panel backdrop-blur-sm transition-opacity duration-300 select-none group-hover:opacity-100">
            <Play className="size-2.5 fill-current" />
            <span>{formatPlayCount(playCount)}次播放</span>
          </div>
        )}
      </div>
      <h3
        className={cn(
          "truncate text-sm text-content",
          appearance === "home" ? "font-medium" : "font-bold",
        )}
      >
        {name}
      </h3>
      {subtitle && <p className="mt-1 line-clamp-2 text-xs text-content-muted">{subtitle}</p>}
    </div>
  );
}
