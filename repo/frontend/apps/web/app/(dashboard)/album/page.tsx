"use client";

import { useMemo } from "react";
import { PlaylistLatticeView } from "@/components/Playlist/lattice/PlaylistLatticeView";
import { PlaylistViewLoading } from "@/components/Playlist/lattice/PlaylistViewLoading";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import TracklistTable from "@/components/Playlist/TrackTable";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useAlbumData } from "@/hooks/album/useAlbumData";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { toNeteaseSongDetails } from "@/lib/providers/netease/adapters/track";
import { useTranslation } from "react-i18next";

import { AlbumActions } from "./_components/AlbumActions";
import { AlbumHeader } from "./_components/AlbumHeader";

export default function AlbumPage() {
  const { t } = useTranslation();
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
  const canOpenArtist = useProviderCapability("artist.read");
  // The immersive views and MV previews read NetEase songs, so only NetEase albums open them.
  const neteaseSongs = useMemo(() => toNeteaseSongDetails(tracks), [tracks]);
  const canOpenLattice = neteaseSongs.length === tracks.length;

  if (!albumId)
    return (
      <div className="flex min-h-screen w-full items-center justify-center text-content-muted">
        <span className="text-lg font-medium">{t("album.empty.invalidId")}</span>
      </div>
    );

  if (isLoading && !ALBUM_INFO)
    return (
      <div className="pt-8 pb-24">
        <PlaylistLoading />
        <PlaylistViewLoading />
      </div>
    );

  if ((isError && !ALBUM_INFO) || (!isLoading && !ALBUM_INFO))
    return (
      <div className="pt-8 pb-24">
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
    <PlaylistLatticeView
      key={albumId}
      sourceId={albumId}
      tracks={neteaseSongs}
      title={ALBUM_INFO.title}
    >
      {(openLattice) => (
        <div className="flex min-h-screen w-full flex-col">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 opacity-60 transition-colors duration-700 md:h-125"
            style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
          />
          <AlbumHeader
            info={ALBUM_INFO}
            onArtistClick={() => {
              if (canOpenArtist && ALBUM_INFO.artistId)
                void smartRouter.push(`/artist?id=${ALBUM_INFO.artistId}`);
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
              previewSongs={neteaseSongs}
              isPlaying={isPlaying}
              isAlbumCollected={isAlbumCollected}
              isTogglingAlbumSubscribe={isTogglingAlbumSubscribe}
              onPlay={togglePlay}
              onOpenLattice={canOpenLattice ? openLattice : undefined}
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
