"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
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
      <main className="min-h-screen bg-surface-raised px-6 pt-24 pb-28 md:px-10">
        <LoginRequiredPrompt reason="library" onLogin={() => router.push("/login")} />
      </main>
    );
  }

  if (recentSongsQuery.isError) {
    return (
      <main className="min-h-screen bg-surface-raised px-6 pt-24 pb-28 md:px-10">
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
      actionSlot={
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/recent/report"
              aria-label={t("library.listeningReport.entry")}
              className="relative inline-flex cursor-pointer items-center justify-center text-content-muted transition-colors hover:text-content"
            >
              <BarChart3 className="size-7 md:size-8" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("library.listeningReport.entry")}
          </TooltipContent>
        </Tooltip>
      }
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
