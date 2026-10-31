"use client";

import { useSearchParams } from "next/navigation";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useArtistData } from "@/hooks/artist/useArtistData";
import { useArtistPlay } from "@/hooks/artist/useArtistPlay";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useTranslation } from "react-i18next";

import { AboutSection } from "./_components/AboutSection";
import { ActionBar } from "./_components/ActionBar";
import { ArtistHero } from "./_components/ArtistHero";
import { ArtistInvalidId } from "./_components/ArtistInvalidId";
import { ArtistLoading } from "./_components/ArtistLoading";
import { ArtistRefetchError } from "./_components/ArtistRefetchError";
import { DiscographyGrid } from "./_components/DiscographyGrid";
import { PopularTracks } from "./_components/PopularTracks";

export default function ArtistPage() {
  const { t } = useTranslation();
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

  if (!artistId) return <ArtistInvalidId />;

  if (isLoading) return <ArtistLoading />;

  if (!artist)
    return (
      <div className="p-8">
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
    <>
      <ArtistHero artist={artist} />

      {isError && <ArtistRefetchError isRefreshing={isRefreshing} onRetry={() => void refetch()} />}

      <div className="hero-content-transition mx-auto w-full max-w-7xl pb-24">
        <ActionBar
          artistId={artist.id}
          isPlayingArtist={isPlayingArtist}
          disabled={hotTracksQueue.length === 0}
          onPlayArtist={handlePlayArtist}
        />

        <div className="flex flex-col items-start gap-8 px-6 md:px-8 lg:flex-row lg:gap-12">
          <PopularTracks tracks={popularTracks} queue={hotTracksQueue} artist={artist} />
          <aside className="sticky top-4 w-full shrink-0 self-start lg:w-80">
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
    </>
  );
}
