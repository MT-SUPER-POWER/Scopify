"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { memo, useCallback } from "react";

import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type { SongDetail } from "@/types/api/music";

interface NewSongItemProps {
  index: number;
  song: SongDetail;
  onPlay: (song: SongDetail, index: number) => void;
}

export const NewSongItem = memo(function NewSongItem({ index, onPlay, song }: NewSongItemProps) {
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const isActive = currentSongDetail?.id === song.id;

  const handleClick = useCallback(() => {
    if (isActive) {
      setIsPlaying(!isPlaying);
      return;
    }
    onPlay(song, index);
  }, [isActive, isPlaying, setIsPlaying, onPlay, song, index]);

  const artistsText = song.ar?.map((a) => a.name).join(" / ") || "";
  const subtitle = song.al?.name ? `${artistsText} · ${song.al.name}` : artistsText;
  const coverUrl = song.al?.picUrl ? `${song.al.picUrl}?param=120y120` : "";

  const itemContent = (
    <div
      onClick={handleClick}
      className={cn(
        "group flex min-w-0 items-center justify-between rounded-lg p-2 transition-colors",
        "cursor-pointer select-none hover:bg-content/10",
        isActive && "bg-content/5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Cover with overlay play button */}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-surface-sunken shadow-xs">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={song.name}
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-surface-elevated" />
          )}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {isActive && isPlaying ? (
              <Pause className="size-5 fill-white text-white" />
            ) : (
              <Play className="ml-0.5 size-5 fill-white text-white" />
            )}
          </div>
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "truncate text-sm font-medium",
                isActive ? "font-semibold text-brand" : "text-content",
              )}
              title={song.name}
            >
              {song.name}
            </span>
            <SongVipBadge fee={song.fee} />
          </div>
          <p className="mt-0.5 truncate text-xs text-content-muted" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Duration */}
      <div className="ml-3 shrink-0 pr-1 text-xs text-content-muted tabular-nums">
        {formatDuration(song.dt)}
      </div>
    </div>
  );

  return (
    <SongContextMenu isActive={isActive} isPlaying={isPlaying} onPlay={handleClick} song={song}>
      {itemContent}
    </SongContextMenu>
  );
});
