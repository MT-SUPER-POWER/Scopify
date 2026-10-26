"use client";

import { ArtistTopSongsSection } from "@/components/home/ArtistTopSongsSection";
import { SuggestedArtists } from "@/components/home/SuggestedArtists";
import { QueryPending } from "@/components/shared/QueryPending";
import { useHotArtistsQuery, useFollowedArtistsQuery } from "@/hooks/home/useHomeQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { selectFallbackSource, toFallbackSource } from "@/lib/query/fallbackSource";
import type { ArtistTopListItem } from "@/types/home";
import type { HomeQueryContentProps } from "@/types/components/home";

export function HomeSuggestedArtistsContent() {
  const query = useHotArtistsQuery();
  if (query.isPending) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  return <SuggestedArtists artists={query.data?.artists ?? []} />;
}

export function HomeArtistTopSongsContent({ actions }: HomeQueryContentProps) {
  const isLogin = useLoginStatus();
  const followed = useFollowedArtistsQuery(isLogin, 30, false);
  const hot = useHotArtistsQuery(50, false);
  const followedItems: ArtistTopListItem[] | undefined = followed.data?.data?.map((artist) => ({
    id: artist.id,
    name: artist.name,
    picUrl: artist.picUrl || artist.avatarUrl || artist.img1v1Url || "",
  }));
  const hotItems = hot.data?.artists?.map((artist) => ({
    id: artist.id,
    name: artist.name,
    picUrl: artist.picUrl || artist.img1v1Url || "",
    musicSize: artist.musicSize,
  }));
  const result = selectFallbackSource<ArtistTopListItem[]>(
    [
      ...(isLogin ? [toFallbackSource(followed, followedItems)] : []),
      toFallbackSource(hot, hotItems),
    ],
    (items) => items.length > 0,
  );
  if (result.isPending) return <QueryPending isPaused={result.isPaused} />;
  return (
    <ArtistTopSongsSection
      artists={result.data ?? []}
      loadingPlayId={actions.loadingPlayId}
      onPlayArtist={actions.handlePlayArtistTopSongs}
    />
  );
}
