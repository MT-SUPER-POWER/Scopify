"use client";

import { NowPlayingArtistCard } from "./NowPlayingArtistCard";
import { NowPlayingSongResources } from "./NowPlayingSongResources";
import { NowPlayingCredits } from "./NowPlayingCredits";
import { NowPlayingHero } from "./NowPlayingHero";
import { NowPlayingHotComments } from "./NowPlayingHotComments";
import { NowPlayingLyricsPreview } from "./NowPlayingLyricsPreview";
import { NowPlayingMvs } from "./NowPlayingMvs";
import { NowPlayingNextUp } from "./NowPlayingNextUp";
import { NowPlayingSimilarSongs } from "./NowPlayingSimilarSongs";
import { useEffect, useRef } from "react";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NowPlayingOverviewProps } from "@/types/player/nowPlayingComponents";

/** 浮动顶栏的高度：封面底边滚到它下面时，顶栏改为实色。 */
const FLOATING_HEADER_HEIGHT = 56;

/** 面板的「正在播放」视图：大封面与一列信息卡片。 */
export function NowPlayingOverview({ song, onCoverVisibleChange }: NowPlayingOverviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const media = viewport.querySelector<HTMLElement>("[data-now-playing-media]");
      const coverBottom = media ? media.offsetTop + media.offsetHeight : 0;
      onCoverVisibleChange(viewport.scrollTop + FLOATING_HEADER_HEIGHT < coverBottom);
    };
    update();
    viewport.addEventListener("scroll", update, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", update);
      onCoverVisibleChange(true);
    };
  }, [onCoverVisibleChange]);

  return (
    <ScrollArea
      viewportRef={viewportRef}
      className="min-h-0 flex-1"
      viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        <NowPlayingHero song={song} />
        <NowPlayingLyricsPreview artworkUrl={resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl)} />
        {song.ar?.[0] && (
          <NowPlayingArtistCard
            key={song.ar[0].id}
            artist={{ id: String(song.ar[0].id), name: song.ar[0].name }}
          />
        )}
        <NowPlayingMvs song={song} />
        <NowPlayingCredits song={song} />
        <NowPlayingSongResources key={`resources-${song.id}`} song={song} />
        <NowPlayingHotComments
          key={`comments-${song.id}`}
          track={{ provider: "netease", id: String(song.id) }}
        />
        <NowPlayingNextUp />
        <NowPlayingSimilarSongs song={song} />
      </div>
    </ScrollArea>
  );
}
