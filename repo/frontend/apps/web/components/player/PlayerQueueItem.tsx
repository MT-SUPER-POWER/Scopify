"use client";

import { memo, useMemo } from "react";
import { PlayerQueueItemCover } from "@/components/player/PlayerQueueItemCover";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { useNowPlayingDislike } from "@/hooks/player/useNowPlayingDislike";
import { toArtistLinks } from "@/lib/player/trackDisplay";
import { toNeteaseSongDetail } from "@/lib/providers/netease/adapters/track";
import { cn, formatDuration } from "@/lib/utils";
import type { QueueItemProps } from "@/types/player/components";

export const PlayerQueueItem = memo(function PlayerQueueItem({
  song,
  index,
  isActive,
  isPlaying,
  onPlay,
  onRemove,
}: QueueItemProps) {
  // The context menu and dislike act on NetEase songs; other platforms get the plain row.
  const neteaseSong = useMemo(() => toNeteaseSongDetail(song), [song]);
  const { dislike, isDailyRecommend, isPersonalFm } = useNowPlayingDislike(neteaseSong);

  const content = (
    <div
      onClick={() => onPlay(index)}
      className={cn(
        "group flex h-15 items-center gap-3 rounded-md p-2 transition-colors",
        "cursor-pointer",
        isActive ? "bg-content/10" : "hover:bg-content/10",
      )}
    >
      <PlayerQueueItemCover index={index} isActive={isActive} isPlaying={isPlaying} song={song} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn("truncate text-sm font-medium", isActive ? "text-brand" : "text-content")}
            title={song.title}
          >
            {song.title}
          </span>
          <SongVipBadge fee={song.netease?.fee} />
        </div>
        <div className="mt-0.5 truncate text-xs text-content-muted">
          <ArtistInlineLinks artists={toArtistLinks(song)} />
        </div>
      </div>
      <div className="shrink-0 pr-1 text-xs text-content-muted tabular-nums">
        {formatDuration(song.durationMs)}
      </div>
    </div>
  );
  if (!neteaseSong) return content;
  return (
    <SongContextMenu
      song={neteaseSong}
      isActive={isActive}
      isPlaying={isPlaying}
      onPlay={() => onPlay(index)}
      onRemoveFromQueue={() => onRemove(index)}
      isDailyRecommend={isDailyRecommend}
      onDislikeDailyRecommend={isDailyRecommend ? () => void dislike() : undefined}
      onDislikePersonalFm={isPersonalFm ? () => void dislike() : undefined}
    >
      {content}
    </SongContextMenu>
  );
});
