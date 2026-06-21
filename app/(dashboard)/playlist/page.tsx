"use client";

import PlaylistHeader from "@components/Playlist/Header";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlaylistActions from "@/components/Playlist/ActionStation";
import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import { usePlaylist } from "@/components/Playlist/hook/usePlaylistData";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import TracklistTable from "@/components/Playlist/TrackTable";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

export default function PlaylistPage() {
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { playlistId, isDailyRecommend, isLoading, playlistInfo, themeColor } = usePlaylist();

  const albumList = useUserStore((s) => s.albumList);
  const triggerLibraryUpdate = useUserStore((s) => s.triggerLibraryUpdate);

  const dynamicPlaylistInfo = useMemo(() => {
    if (!playlistInfo) return null;
    if (isLoading) return playlistInfo;
    return { ...playlistInfo, totalSongs: albumList ? albumList.length : playlistInfo.totalSongs, cover: playlistInfo.cover };
  }, [playlistInfo, albumList, isLoading]);

  const handleSearchOpen = useCallback(() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }, []);
  const handleSearchClose = useCallback(() => { setSearchOpen(false); setSearchQuery(""); }, []);
  const handleRefreshTracks = useCallback(() => { triggerLibraryUpdate(); }, [triggerLibraryUpdate]);

  const clearAlbumList = useUserStore((s) => s.clearAlbumList);
  useEffect(() => { return () => { clearAlbumList(); }; }, [clearAlbumList]);

  if (!playlistId && !isDailyRecommend)
    return <div className="p-8 text-white">{t("playlist.page.invalidUrl")}</div>;

  return (
    <div key={playlistId ?? "daily"} className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans">
      <div className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }} />
      {dynamicPlaylistInfo && <PlaylistHeader info={dynamicPlaylistInfo} isDaily={isDailyRecommend} />}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        {isLoading ? <PlaylistHeaderSkeleton /> : (
          <PlaylistActions playlistId={playlistId} isDaily={isDailyRecommend} searchOpen={searchOpen}
            searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchOpen={handleSearchOpen}
            onSearchClose={handleSearchClose} inputRef={inputRef} />
        )}
        <div className="px-6 flex-1 pb-10 min-w-0 overflow-hidden">
          {isLoading ? <PlaylistLoading /> : (
            <TracklistTable searchOpen={searchOpen} searchQuery={searchQuery}
              onSearchChange={setSearchQuery} onSearchOpen={handleSearchOpen} onSearchClose={handleSearchClose}
              inputRef={inputRef} emptyActionLabel={t("common.action.reload")} onEmptyAction={handleRefreshTracks} />
          )}
        </div>
      </div>
    </div>
  );
}
