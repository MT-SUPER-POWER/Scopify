"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AboutSection } from "@/components/artist/AboutSection";
import { ActionBar } from "@/components/artist/ActionBar";
import { ArtistHero } from "@/components/artist/ArtistHero";
import { DiscographyGrid } from "@/components/artist/DiscographyGrid";
import { PopularTracks } from "@/components/artist/PopularTracks";
import { RetryState } from "@scopify/ui/scopify/components/retry-state";
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
      <div className="h-screen bg-surface-raised p-8 text-content">
        {t("artist.page.invalidId")}
      </div>
    );

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-surface-raised p-8 text-content">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );

  if (!artist)
    return (
      <div className="min-h-screen bg-surface-raised p-8">
        <RetryState
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={isRefreshing}
          onRetry={() => void refetch()}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-surface-raised pb-24 font-sans text-content">
      <ArtistHero artist={artist} />

      {isError && (
        <div className="px-6 pt-6 md:px-8">
          <RetryState
            compact
            title={t("network.offline.title")}
            subtitle={t("network.offline.subtitle")}
            actionLabel={t("network.action.refresh")}
            isRetrying={isRefreshing}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      <div className="hero-content-transition mx-auto w-full max-w-7xl">
        <ActionBar
          artistId={artist.id}
          isPlayingArtist={isPlayingArtist}
          disabled={hotTracksQueue.length === 0}
          onPlayArtist={handlePlayArtist}
        />

        <div className="flex flex-col items-start gap-8 px-6 md:px-8 lg:flex-row lg:gap-12">
          <PopularTracks tracks={popularTracks} queue={hotTracksQueue} artist={artist} />
          <aside className="sticky top-20 w-full shrink-0 self-start lg:w-80">
            <AboutSection artist={artist} />
          </aside>
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
