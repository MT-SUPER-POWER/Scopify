"use client";

import { PlaylistLatticeView } from "@/components/Playlist/lattice/PlaylistLatticeView";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import TracklistTable from "@/components/Playlist/TrackTable";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useAlbumData } from "@/hooks/album/useAlbumData";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import { AlbumActions } from "./_components/AlbumActions";
import { AlbumHeader } from "./_components/AlbumHeader";
import { AlbumInvalidId } from "./_components/AlbumInvalidId";
import { AlbumUnavailable } from "./_components/AlbumUnavailable";

export default function AlbumPage() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const {
    ALBUM_INFO,
    albumId,
    handleRefresh,
    handleToggleAlbumSubscribe,
    isAlbumCollected,
    isError,
    isLoading,
    isPlaying,
    isRefetchError,
    isRefreshing,
    isTogglingAlbumSubscribe,
    themeColor,
    togglePlay,
    tracks,
  } = useAlbumData();

  if (!albumId) return <AlbumInvalidId />;

  if (isLoading && !ALBUM_INFO)
    return (
      <div className="pt-8 pb-24">
        <PlaylistLoading />
      </div>
    );

  if ((isError && !ALBUM_INFO) || (!isLoading && !ALBUM_INFO))
    return <AlbumUnavailable onRetry={() => void handleRefresh()} />;

  if (!ALBUM_INFO) return null;

  return (
    <PlaylistLatticeView key={albumId} sourceId={albumId} tracks={tracks} title={ALBUM_INFO.title}>
      {(openLattice) => (
        <div className="flex min-h-screen w-full flex-col">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 opacity-60 transition-colors duration-700 md:h-125"
            style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
          />
          <AlbumHeader
            info={ALBUM_INFO}
            onArtistClick={() => {
              if (ALBUM_INFO.artistId) void smartRouter.push(`/artist?id=${ALBUM_INFO.artistId}`);
            }}
          />
          {isRefetchError && (
            <div className="relative z-10 px-6">
              <NetworkRetryState
                compact
                title={t("album.status.updateFailed")}
                subtitle={t("album.status.updateFailedDescription")}
                actionLabel={t("network.action.refresh")}
                isRetrying={isRefreshing}
                onRetry={() => void handleRefresh()}
              />
            </div>
          )}
          <div className="hero-content-transition relative z-10 flex flex-1 flex-col">
            <AlbumActions
              albumId={albumId}
              albumTitle={ALBUM_INFO.title}
              tracks={tracks}
              isPlaying={isPlaying}
              isAlbumCollected={isAlbumCollected}
              isTogglingAlbumSubscribe={isTogglingAlbumSubscribe}
              onPlay={togglePlay}
              onOpenLattice={openLattice}
              onToggleSubscribe={() => void handleToggleAlbumSubscribe()}
            />
            <div className="min-w-0 flex-1 px-6 pb-10">
              <TracklistTable
                disableVirtualization
                hideDateColumn
                hideLikeColumn
                readonly
                tracks={tracks}
              />
            </div>
          </div>
        </div>
      )}
    </PlaylistLatticeView>
  );
}
