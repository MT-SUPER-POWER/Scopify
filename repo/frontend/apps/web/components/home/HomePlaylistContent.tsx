"use client";

import { HomeGreetingSection } from "@/components/home/HomeGreetingSection";
import { PersonalizedPlaylists } from "@/components/home/PersonalizedPlaylists";
import { QueryPending } from "@/components/shared/QueryPending";
import {
  usePersonalizedPlaylistsQuery,
  useRecommendedPlaylistsQuery,
} from "@/hooks/home/useHomeQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { selectFallbackSource, toFallbackSource } from "@/lib/query/fallbackSource";
import { pruneRecommendPlaylist } from "@/types/api/playlist";
import type { HomeGreetingContentProps, HomeQueryContentProps } from "@/types/components/home";

export function HomeGreetingContent({ actions, greeting, dateInfo }: HomeGreetingContentProps) {
  const query = usePersonalizedPlaylistsQuery();
  if (query.isPending) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  return (
    <HomeGreetingSection
      greeting={greeting}
      dateInfo={dateInfo}
      playlists={query.data?.result?.map(pruneRecommendPlaylist) ?? []}
      loadingPlayId={actions.loadingPlayId}
      onPlayPlaylist={actions.handlePlayPlaylist}
    />
  );
}

export function HomePlaylistContent({ actions }: HomeQueryContentProps) {
  const isLogin = useLoginStatus();
  // 个性化与公共推荐是同一栏目的明确备用来源；任一可用时保留该栏目。
  const personalized = usePersonalizedPlaylistsQuery(100, false);
  const recommended = useRecommendedPlaylistsQuery(isLogin, false);
  const sources = [
    ...(isLogin ? [toFallbackSource(recommended, recommended.data?.recommend)] : []),
    toFallbackSource(personalized, personalized.data?.result),
  ];
  const result = selectFallbackSource(sources, (items) => items.length > 0);
  if (result.isPending) return <QueryPending isPaused={result.isPaused} />;
  return (
    <PersonalizedPlaylists
      playlists={(result.data ?? []).map(pruneRecommendPlaylist)}
      loadingPlayId={actions.loadingPlayId}
      onPlayPlaylist={actions.handlePlayPlaylist}
    />
  );
}
