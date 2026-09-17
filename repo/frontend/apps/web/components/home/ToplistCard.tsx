"use client";

import { Loader2, Play } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import type { ToplistDetailItem } from "@/types/api/toplist";

interface ToplistCardProps {
  isLoading?: boolean;
  onPlay: (id: number | string, event: React.MouseEvent) => void;
  toplist: ToplistDetailItem;
}

export const ToplistCard = memo(function ToplistCard({
  isLoading = false,
  onPlay,
  toplist,
}: ToplistCardProps) {
  const smartRouter = useSmartRouter();

  const handleClick = () => {
    smartRouter.push(`/playlist/?id=${toplist.id}&isRecommend=true`);
  };

  const coverUrl = toplist.coverImgUrl ? `${toplist.coverImgUrl}?param=180y180` : "";
  const tracks = toplist.tracks?.slice(0, 3) ?? [];

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl",
        "border border-content/5 bg-surface-elevated/70 p-3.5 transition-all duration-300",
        "hover:bg-surface-overlay hover:shadow-md",
      )}
    >
      {/* Top: Cover & Chart Title */}
      <div className="flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken shadow-xs">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={toplist.name}
              width={64}
              height={64}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-surface-elevated" />
          )}
          <button
            type="button"
            onClick={(e) => onPlay(toplist.id, e)}
            disabled={isLoading}
            className={cn(
              "absolute right-1 bottom-1 flex size-7 items-center justify-center rounded-full",
              "bg-brand text-brand-foreground shadow-brand transition-all duration-300",
              "opacity-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover",
              isLoading && "opacity-100",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="ml-0.5 size-3.5 fill-current" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-content transition-colors group-hover:text-brand">
            {toplist.name}
          </h3>
          {toplist.updateFrequency && (
            <span className="mt-1 inline-block rounded-full bg-content/5 px-2 py-0.5 text-[10px] font-medium text-content-muted">
              {toplist.updateFrequency}
            </span>
          )}
        </div>
      </div>

      {/* Tracks Preview */}
      {tracks.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-1.5 border-t border-content/5 pt-2.5">
          {tracks.map((track, idx) => (
            <div
              key={idx}
              className="flex min-w-0 items-baseline gap-1.5 text-xs"
              title={`${track.first} - ${track.second}`}
            >
              <span
                className={cn(
                  "shrink-0 text-xs font-bold tabular-nums",
                  idx === 0 ? "text-brand" : "text-content-muted",
                )}
              >
                {idx + 1}
              </span>
              <span className="truncate font-medium text-content">{track.first}</span>
              <span className="shrink-0 truncate text-[11px] text-content-muted">
                - {track.second}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
