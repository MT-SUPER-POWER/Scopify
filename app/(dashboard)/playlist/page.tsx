"use client";

import PlaylistHeader from "@components/Playlist/Header";
import { useCallback, useMemo, useRef, useState } from "react";
import PlaylistActions from "@/components/Playlist/ActionStation";
import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import TracklistTable from "@/components/Playlist/TrackTable";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useI18n } from "@/store/module/i18n";

export default function PlaylistPage() {
  useRouteRestorationPlaceholder(PlaylistPageSkeleton);
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    playlistId,
    isDailyRecommend,
    dailyDate,
    isLoading,
    playlistInfo,
    refetchTracks,
    setTracks,
    themeColor,
    tracks,
  } = usePlaylist();

  const dynamicPlaylistInfo = useMemo(() => {
    if (!playlistInfo) return null;
    return {
      ...playlistInfo,
      totalSongs: tracks.length,
      cover: playlistInfo.cover,
    };
  }, [playlistInfo, tracks.length]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);
  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);
  const handleRefreshTracks = useCallback(() => {
    void refetchTracks();
  }, [refetchTracks]);

  if (!playlistId && !isDailyRecommend)
    return <div className="p-8 text-white">{t("playlist.page.invalidUrl")}</div>;

  return (
    <div
      key={playlistId ?? (dailyDate ? `daily:${dailyDate}` : "daily")}
      className="relative flex min-h-screen w-full flex-col bg-[#121212] font-sans"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 opacity-60 md:h-125"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
      />
      {dynamicPlaylistInfo && (
        <PlaylistHeader info={dynamicPlaylistInfo} isDaily={isDailyRecommend} />
      )}
      <div className="relative z-10 flex flex-1 flex-col bg-linear-to-b from-black/20 via-[#121212] via-20% to-[#121212]">
        {isLoading ? (
          <PlaylistHeaderSkeleton />
        ) : (
          <PlaylistActions
            playlistId={playlistId}
            isDaily={isDailyRecommend}
            dailyDate={dailyDate}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchOpen={handleSearchOpen}
            onSearchClose={handleSearchClose}
            inputRef={inputRef}
            tracks={tracks}
          />
        )}
        <div className="min-w-0 flex-1 overflow-hidden px-6 pb-10">
          {isLoading ? (
            <PlaylistLoading />
          ) : (
            <TracklistTable
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={handleSearchOpen}
              onSearchClose={handleSearchClose}
              inputRef={inputRef}
              emptyActionLabel={t("common.action.reload")}
              onEmptyAction={handleRefreshTracks}
              onTracksChange={setTracks}
              tracks={tracks}
            />
          )}
        </div>
      </div>
    </div>
  );
}
