"use client";

import { AlbumActions } from "@/components/album/AlbumActions";
import { AlbumHeader } from "@/components/album/AlbumHeader";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import TracklistTable from "@/components/Playlist/TrackTable";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useAlbumData } from "@/hooks/album/useAlbumData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

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

  if (!albumId)
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-surface-raised text-content-muted">
        <span className="text-lg font-medium">{t("album.empty.invalidId")}</span>
      </div>
    );

  if (isLoading && !ALBUM_INFO)
    return (
      <div className="min-h-screen w-full bg-surface-raised px-6 py-24">
        <PlaylistLoading />
      </div>
    );

  if ((isError && !ALBUM_INFO) || (!isLoading && !ALBUM_INFO))
    return (
      <div className="min-h-screen w-full bg-surface-raised px-6 py-24">
        <div className="mb-6 opacity-70">
          <PlaylistLoading />
        </div>
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("album.empty.unavailable")}
          actionLabel={t("network.action.refresh")}
          onRetry={() => void handleRefresh()}
        />
      </div>
    );

  if (!ALBUM_INFO) return null;

  return (
    <div
      key={albumId}
      className="relative flex min-h-screen w-full flex-col bg-surface-raised font-sans"
    >
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
          isPlaying={isPlaying}
          isAlbumCollected={isAlbumCollected}
          isTogglingAlbumSubscribe={isTogglingAlbumSubscribe}
          onPlay={togglePlay}
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
  );
}
