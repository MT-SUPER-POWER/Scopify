"use client";

import { Heart, MoreHorizontal, Pause, Play } from "lucide-react";
import type React from "react";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { cn } from "@/lib/utils";
import type { Song } from "@/types/search";

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
      className="group hover:bg-content/10 active:bg-content/5 flex cursor-pointer items-center justify-between rounded-md p-2.5 transition-colors"
      onClick={onRowClick}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="bg-surface-elevated relative size-11 shrink-0 rounded">
          <img src={imageUrl} alt={song.name} className="size-full rounded object-cover" />
          <div
            className={cn(
              "bg-media-overlay absolute inset-0 flex items-center justify-center rounded transition-opacity",
              isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <button
              type="button"
              onClick={onTogglePlay}
              className="text-overlay-foreground transition-transform hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="ml-0.5 size-5 fill-current" />
              )}
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "truncate text-base font-medium",
                isPlaying ? "text-brand" : "text-content",
              )}
              title={song.name}
            >
              {song.name}
            </span>
            <SongVipBadge fee={song.fee} />
          </div>
          <span className="text-content-muted group-hover:text-content truncate text-sm transition-colors">
            <ArtistInlineLinks artists={song.artists ?? []} />
          </span>
        </div>
      </div>

      <div className="text-content-muted ml-4 flex shrink-0 items-center gap-6">
        <Heart className="hover:text-content size-4 cursor-pointer opacity-0 transition-all group-hover:opacity-100 hover:scale-110" />
        <span className="w-12 text-right text-sm font-medium tabular-nums">
          {formatDuration(song.duration)}
        </span>
        <MoreHorizontal className="hover:text-content size-5 cursor-pointer opacity-0 transition-all group-hover:opacity-100" />
      </div>
    </div>
  );
}
