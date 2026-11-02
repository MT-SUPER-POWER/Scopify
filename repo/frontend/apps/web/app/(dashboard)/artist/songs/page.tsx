"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useArtistData } from "@/hooks/artist/useArtistData";
import { useArtistPopularSongsTheme } from "@/hooks/artist/useArtistPopularSongsTheme";
import { useTranslation } from "react-i18next";

import type { PlaylistInfo } from "@/types/playlist/model";
import { ArtistInvalidId } from "../_components/ArtistInvalidId";
import { ArtistLoading } from "../_components/ArtistLoading";
import { ArtistRefetchError } from "../_components/ArtistRefetchError";

export default function ArtistPopularSongsPage() {
  const { t } = useTranslation();
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
  const themeColor = useArtistPopularSongsTheme(playlistInfo?.cover);

  if (!artistId) return <ArtistInvalidId />;

  if (isLoading) return <ArtistLoading />;

  if (!artist)
    return (
      <main className="px-6 pt-8 pb-28 md:px-10">
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
      {isError && <ArtistRefetchError isRefreshing={isRefreshing} onRetry={() => void refetch()} />}
      <PlaylistContent
        dailyDate={null}
        isDailyRecommend={false}
        isLoading={isPopularTracksLoading}
        playlistId={null}
        playlistInfo={playlistInfo}
        playSourceId={`artist:${artist.id}:popular`}
        readonly
        refetchTracks={refetch}
        themeColor={themeColor}
        tracks={popularTracks}
      />
    </>
  );
}
