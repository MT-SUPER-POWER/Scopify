"use client";

import { useMemo } from "react";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useRecentSongsQuery } from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistInfo } from "@/types/playlist";

export default function RecentSongsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const recentSongsQuery = useRecentSongsQuery();
  const tracks = useMemo(() => recentSongsQuery.data ?? [], [recentSongsQuery.data]);
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (recentSongsQuery.isLoading) return null;

    return {
      cover: tracks[0]?.al.picUrl ?? null,
      createTime: "",
      creator: "",
      creatorAvatar: "",
      creatorID: null,
      isSpecial: true,
      likes: "",
      privacy: t("library.meta.playbackHistory"),
      tags: [],
      title: t("library.title.recent"),
      totalSongs: tracks.length,
    };
  }, [recentSongsQuery.isLoading, t, tracks]);

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#121212] px-6 pt-24 pb-28 md:px-10">
        <LoginRequiredPrompt
          reason="library"
          onLogin={() => router.push("/login?reason=library")}
        />
      </main>
    );
  }

  if (recentSongsQuery.isError) {
    return (
      <main className="min-h-screen bg-[#121212] px-6 pt-24 pb-28 md:px-10">
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={recentSongsQuery.isRefetching}
          onRetry={() => void recentSongsQuery.refetch()}
        />
      </main>
    );
  }

  return (
    <PlaylistContent
      dailyDate={null}
      isDailyRecommend={false}
      isLoading={recentSongsQuery.isLoading}
      playlistId={null}
      playlistInfo={playlistInfo}
      playSourceId="library:recent"
      refetchTracks={recentSongsQuery.refetch}
      themeColor="#3B6B61"
      tracks={tracks}
    />
  );
}
