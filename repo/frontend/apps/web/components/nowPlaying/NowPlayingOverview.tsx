"use client";

import { NowPlayingArtistCard } from "./NowPlayingArtistCard";
import { NowPlayingCredits } from "./NowPlayingCredits";
import { NowPlayingHero } from "./NowPlayingHero";
import { NowPlayingHotComments } from "./NowPlayingHotComments";
import { NowPlayingLyricsPreview } from "./NowPlayingLyricsPreview";
import { NowPlayingMvs } from "./NowPlayingMvs";
import { NowPlayingNextUp } from "./NowPlayingNextUp";
import { NowPlayingSimilarSongs } from "./NowPlayingSimilarSongs";
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
        <NowPlayingLyricsPreview song={song} />
        <NowPlayingArtistCard key={song.ar?.[0]?.id} song={song} />
        <NowPlayingMvs song={song} />
        <NowPlayingCredits song={song} />
        <NowPlayingHotComments key={song.id} song={song} />
        <NowPlayingNextUp />
        <NowPlayingSimilarSongs song={song} />
      </div>
    </ScrollArea>
  );
}
