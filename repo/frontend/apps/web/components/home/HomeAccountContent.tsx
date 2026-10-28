"use client";

import { FollowedAlbumsSection } from "@/components/home/FollowedAlbumsSection";
import { RecentlyPlayedPlaylists } from "@/components/home/RecentlyPlayedPlaylists";
import { HomeSectionPending } from "@/components/home/HomeSectionPending";
import {
  useFollowedArtistsAlbumsQuery,
  useRecentPlaylistsQuery,
} from "@/hooks/home/useHomeQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { pruneRecommendPlaylist, type RawRecommendPlaylist } from "@/types/playlist/api";
import type { HomeQueryContentProps } from "@/types/components/home";

export function HomeRecentPlaylistsContent({ actions }: HomeQueryContentProps) {
  const isLogin = useLoginStatus();
  const query = useRecentPlaylistsQuery(isLogin);
  if (!isLogin) return null;
  if (query.isPending)
    return (
      <HomeSectionPending
        isPaused={query.fetchStatus === "paused"}
        kind="grid"
        titleKey="home.recentlyPlayedPlaylists"
      />
    );
  const playlists = (query.data?.data?.list ?? [])
    .map((entry) => entry.data)
    .filter((item): item is RawRecommendPlaylist => Boolean(item?.id && item.name))
    .map(pruneRecommendPlaylist);
  return (
    <RecentlyPlayedPlaylists
      playlists={playlists}
      loadingPlayId={actions.loadingPlayId}
      onPlayPlaylist={actions.handlePlayPlaylist}
    />
  );
}

export function HomeFollowedAlbumsContent({ actions }: HomeQueryContentProps) {
  const isLogin = useLoginStatus();
  const query = useFollowedArtistsAlbumsQuery(isLogin);
  if (!isLogin) return null;
  if (query.isPending)
    return (
      <HomeSectionPending
        isPaused={query.fetchStatus === "paused"}
        kind="grid"
        titleKey="home.followedArtistsAlbums"
      />
    );
  return (
    <FollowedAlbumsSection
      albums={(query.data ?? []).filter((album) => Boolean(album?.id && album.name))}
      loadingPlayId={actions.loadingPlayId}
      onPlayAlbum={actions.handlePlayAlbum}
    />
  );
}
