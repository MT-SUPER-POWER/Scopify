"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { memo, useCallback } from "react";

import { TrackContextMenu } from "@/components/shared/TrackContextMenu";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { TrackVipBadge } from "@/components/shared/TrackBadges";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { toNeteaseSongDetail } from "@/lib/providers/netease/adapters/track";
import { cn, formatDuration } from "@/lib/utils";
import { musicResourceKey } from "@scopify/music-domain/identity";
import { usePlayerStore } from "@/store";
import type { PlayerTrack } from "@/types/player/model";

interface NewSongItemProps {
  index: number;
  song: PlayerTrack;
  onPlay: (song: PlayerTrack, index: number) => void;
}

export const NewSongItem = memo(function NewSongItem({ index, onPlay, song }: NewSongItemProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const isActive =
    currentTrack !== null && musicResourceKey(currentTrack.ref) === musicResourceKey(song.ref);

  const handleClick = useCallback(() => {
    if (isActive) {
      setIsPlaying(!isPlaying);
      return;
    }
    onPlay(song, index);
  }, [isActive, isPlaying, setIsPlaying, onPlay, song, index]);

  const artistsText = song.artists.map((artist) => artist.name).join(" / ");
  const subtitle = song.album?.title ? `${artistsText} · ${song.album.title}` : artistsText;
  const coverUrl = getSizedImageUrl(song.album?.coverUrl, 120);

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
              alt={song.title}
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-surface-elevated" />
          )}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-overlay/40 transition-opacity",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {isActive && isPlaying ? (
              <Pause className="size-5 fill-overlay-foreground text-overlay-foreground" />
            ) : (
              <Play className="ml-0.5 size-5 fill-overlay-foreground text-overlay-foreground" />
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
              title={song.title}
            >
              {song.title}
            </span>
            <TrackVipBadge track={song} />
          </div>
          <p className="mt-0.5 truncate text-xs text-content-muted" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Duration */}
      <div className="ml-3 shrink-0 pr-1 text-xs text-content-muted tabular-nums">
        {formatDuration(song.durationMs)}
      </div>
    </div>
  );

  // NetEase keeps its own menu; other platforms get the neutral one.
  const neteaseSong = toNeteaseSongDetail(song);
  if (!neteaseSong) {
    return (
      <TrackContextMenu track={song} isActive={isActive} isPlaying={isPlaying} onPlay={handleClick}>
        {itemContent}
      </TrackContextMenu>
    );
  }

  return (
    <SongContextMenu
      isActive={isActive}
      isPlaying={isPlaying}
      onPlay={handleClick}
      song={neteaseSong}
    >
      {itemContent}
    </SongContextMenu>
  );
});
