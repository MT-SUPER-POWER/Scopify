"use client";

import { Loader2 } from "lucide-react";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import TracklistTable from "@/components/Playlist/TrackTable";
import { AlbumActions } from "@/components/album/AlbumActions";
import { AlbumHeader } from "@/components/album/AlbumHeader";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useAlbumData } from "@/hooks/album/useAlbumData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function AlbumPage() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const {
    albumId, ALBUM_INFO, themeColor, isLoading, isError, reloadKey, setReloadKey,
    isPlaying, isAlbumCollected, isTogglingAlbumSubscribe,
    togglePlay, handleToggleAlbumSubscribe,
  } = useAlbumData();

  if (!albumId) return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#121212] text-zinc-400">
      <span className="text-lg font-medium">{t("album.empty.invalidId")}</span>
    </div>
  );

  if (isLoading && !ALBUM_INFO) return (
    <div className="w-full min-h-screen bg-[#121212] px-6 py-24"><PlaylistLoading /></div>
  );

  if (isError || (!isLoading && !ALBUM_INFO)) return (
    <div className="w-full min-h-screen bg-[#121212] px-6 py-24">
      <div className="mb-6 opacity-70"><PlaylistLoading /></div>
      <NetworkRetryState title={t("network.offline.title")} subtitle={t("album.empty.unavailable")}
        actionLabel={t("network.action.refresh")} onRetry={() => setReloadKey((k) => k + 1)} />
    </div>
  );

  return (
    <div key={albumId} className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans">
      <div className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60 transition-colors duration-700"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }} />
      <AlbumHeader info={ALBUM_INFO!} themeColor={themeColor}
        onArtistClick={() => { if (ALBUM_INFO?.artistId) smartRouter.push(`/artist?id=${ALBUM_INFO.artistId}`); }} />
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        <AlbumActions isPlaying={isPlaying} isAlbumCollected={isAlbumCollected}
          isTogglingAlbumSubscribe={isTogglingAlbumSubscribe}
          onPlay={togglePlay} onToggleSubscribe={handleToggleAlbumSubscribe} />
        <div className="px-6 flex-1 pb-10 min-w-0">
          <TracklistTable disableVirtualization hideDateColumn hideLikeColumn readonly />
        </div>
      </div>
    </div>
  );
}
