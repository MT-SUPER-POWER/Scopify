"use client";

import { NowPlayingArtistCard } from "./NowPlayingArtistCard";
import { NowPlayingHero } from "./NowPlayingHero";
import { NowPlayingNextUp } from "./NowPlayingNextUp";
import { NowPlayingSongInfo } from "./NowPlayingSongInfo";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";

/** 面板的「正在播放」视图：大封面与一列信息卡片。 */
export function NowPlayingOverview({ song }: NowPlayingSectionProps) {
  return (
    <ScrollArea
      className="min-h-0 flex-1"
      viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        <NowPlayingHero song={song} />
        <NowPlayingArtistCard key={song.ar?.[0]?.id} song={song} />
        <NowPlayingNextUp />
        <NowPlayingSongInfo song={song} />
      </div>
    </ScrollArea>
  );
}
