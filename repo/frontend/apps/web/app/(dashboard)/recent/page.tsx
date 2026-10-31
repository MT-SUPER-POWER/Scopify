"use client";

import { History } from "lucide-react";
import { useMemo } from "react";
import { LibraryErrorPage } from "@/components/library/LibraryErrorPage";
import { LibraryStatePage } from "@/components/library/LibraryStatePage";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QuietState } from "@/components/shared/QuietState";
import { useRecentSongsQuery } from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistInfo } from "@/types/playlist/model";
import { RecentReportLink } from "./_components/RecentReportLink";

export default function RecentSongsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
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
      <LibraryStatePage>
        <QuietState icon={History} title={t("library.loggedOut.recent")} />
      </LibraryStatePage>
    );
  }

  if (recentSongsQuery.isError) {
    return (
      <LibraryErrorPage
        isRetrying={recentSongsQuery.isRefetching}
        onRetry={() => void recentSongsQuery.refetch()}
      />
    );
  }

  return (
    <PlaylistContent
      dailyDate={null}
      actionSlot={<RecentReportLink />}
      isDailyRecommend={false}
      isLoading={recentSongsQuery.isLoading}
      playlistId={null}
      playlistInfo={playlistInfo}
      playSourceId="library:recent"
      refetchTracks={recentSongsQuery.refetch}
      themeColor="var(--scopify-page-accent-recent)"
      tracks={tracks}
    />
  );
}
