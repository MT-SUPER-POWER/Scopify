"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useArtistData } from "@/hooks/artist/useArtistData";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistInfo } from "@/types/playlist";

export default function ArtistPopularSongsPage() {
  const { t } = useI18n();
  const artistId = useSearchParams().get("id");
  const {
    artist,
    isError,
    isLoading,
    isPopularTracksLoading,
    isRefreshing,
    popularTracks,
    refetch,
  } = useArtistData(artistId);
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!artist) return null;

    return {
      cover: artist.headerImageUrl || artist.avatar,
      createTime: "",
      creator: artist.name,
      creatorAvatar: artist.avatar,
      isSpecial: true,
      likes: "",
      privacy: t("artist.popular.title"),
      tags: [],
      title: `${artist.name} · ${t("artist.popular.title")}`,
      totalSongs: popularTracks.length,
    };
  }, [artist, popularTracks.length, t]);

  if (!artistId) return <div className="p-8 text-content">{t("artist.page.invalidId")}</div>;

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-surface-raised p-8 text-content">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );

  if (!artist)
    return (
      <main className="min-h-screen bg-surface-raised px-6 pt-24 pb-28 md:px-10">
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={isRefreshing}
          onRetry={() => void refetch()}
        />
      </main>
    );

  return (
    <>
      {isError && (
        <div className="bg-surface-raised px-6 pt-6 md:px-8">
          <NetworkRetryState
            compact
            title={t("network.offline.title")}
            subtitle={t("network.offline.subtitle")}
            actionLabel={t("network.action.refresh")}
            isRetrying={isRefreshing}
            onRetry={() => void refetch()}
          />
        </div>
      )}
      <PlaylistContent
        dailyDate={null}
        isDailyRecommend={false}
        isLoading={isPopularTracksLoading}
        playlistId={null}
        playlistInfo={playlistInfo}
        playSourceId={`artist:${artist.id}:popular`}
        readonly
        refetchTracks={refetch}
        themeColor={null}
        tracks={popularTracks}
      />
    </>
  );
}
