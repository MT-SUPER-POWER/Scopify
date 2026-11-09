"use client";

import { NowPlayingArtistCard } from "./NowPlayingArtistCard";
import { NowPlayingHotComments } from "./NowPlayingHotComments";
import { NowPlayingLyricsPreview } from "./NowPlayingLyricsPreview";
import { NowPlayingNextUp } from "./NowPlayingNextUp";
import { NowPlayingProviderCard } from "./NowPlayingProviderCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProviderCapability, useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";

import type { PlayerTrack } from "@/types/player/model";

/** 面板的「正在播放」视图：网易云以外的平台，用曲目本身的信息组成同样的卡片列。 */
export function NowPlayingProviderOverview({ track }: { track: PlayerTrack }) {
  const provider = useActiveProvider();
  const canReadArtist = useProviderCapability("artist.read");
  const canReadComments =
    useProviderCapability("comments.read") && provider.commentTargetKinds.has("track");
  const artist = track.artists.find((item) => item.ref.id);

  return (
    <ScrollArea
      className="min-h-0 flex-1"
      viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        <NowPlayingProviderCard track={track} />
        <NowPlayingLyricsPreview artworkUrl={resolveCoverUrl(track.album?.coverUrl ?? undefined)} />
        {canReadArtist && artist && (
          <NowPlayingArtistCard
            key={artist.ref.id}
            artist={{ id: artist.ref.id, name: artist.name }}
          />
        )}
        {canReadComments && (
          <NowPlayingHotComments
            key={`comments-${track.ref.id}`}
            track={{ provider: track.ref.provider, id: track.ref.id }}
          />
        )}
        <NowPlayingNextUp />
      </div>
    </ScrollArea>
  );
}
