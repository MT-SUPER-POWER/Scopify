"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AboutSection } from "@/components/artist/AboutSection";
import { ActionBar } from "@/components/artist/ActionBar";
import { ArtistHero } from "@/components/artist/ArtistHero";
import { DiscographyGrid } from "@/components/artist/DiscographyGrid";
import { PopularTracks } from "@/components/artist/PopularTracks";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useArtistData } from "@/hooks/artist/useArtistData";
import { useArtistPlay } from "@/hooks/artist/useArtistPlay";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function ArtistPage() {
  const { t } = useI18n();
  const artistId = useSearchParams().get("id");
  const router = useSmartRouter();

  const {
    artist,
    popularTracks,
    hotTracksQueue,
    discography,
    isError,
    isLoading,
    isRefreshing,
    refetch,
  } = useArtistData(artistId);
  const { isPlayingArtist, loadingAlbumId, handlePlayArtist, handlePlayAlbum } =
    useArtistPlay(hotTracksQueue);

  if (!artistId)
    return (
      <div className="bg-surface-raised text-content h-screen p-8">
        {t("artist.page.invalidId")}
      </div>
    );

  if (isLoading)
    return (
      <div className="bg-surface-raised text-content flex h-screen items-center justify-center p-8">
        <Loader2 className="text-brand size-8 animate-spin" />
      </div>
    );

  if (!artist)
    return (
      <div className="bg-surface-raised min-h-screen p-8">
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={isRefreshing}
          onRetry={() => void refetch()}
        />
      </div>
    );

  return (
    <div className="bg-surface-raised text-content min-h-screen overflow-x-hidden pb-24 font-sans">
      <ArtistHero artist={artist} />

      {isError && (
        <div className="px-6 pt-6 md:px-8">
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

      <div className="from-hero-shade to-surface-raised mx-auto w-full max-w-7xl bg-linear-to-b">
        <ActionBar
          artistId={artist.id}
          isPlayingArtist={isPlayingArtist}
          disabled={hotTracksQueue.length === 0}
          onPlayArtist={handlePlayArtist}
        />

        <div className="flex flex-col gap-12 px-6 md:px-8 xl:flex-row">
          <PopularTracks tracks={popularTracks} queue={hotTracksQueue} artist={artist} />
          <AboutSection artist={artist} />
        </div>

        <DiscographyGrid
          albums={discography}
          loadingAlbumId={loadingAlbumId}
          onPlayAlbum={handlePlayAlbum}
          onClickAlbum={(id) => router.push(`/album?id=${id}`)}
        />
      </div>
    </div>
  );
}
