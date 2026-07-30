"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import PlaylistActions from "@/components/Playlist/ActionStation";
import PlaylistHeader from "@/components/Playlist/Header";
import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import TracklistTable from "@/components/Playlist/TrackTable";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";
import { DASHBOARD_HEADER_HEIGHT } from "@/constants/layout";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistContentProps } from "@/types/components/playlist";

export function PlaylistContent({
  actionSlot,
  contentSlot,
  dailyDate,
  hideAlbumColumn,
  isDailyRecommend,
  isLoading,
  playlistId,
  playlistInfo,
  playSourceId,
  readonly = false,
  refetchTracks,
  setTracks,
  themeColor,
  tracks,
}: PlaylistContentProps) {
  useRouteRestorationPlaceholder(PlaylistPageSkeleton);
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dynamicPlaylistInfo = useMemo(() => {
    if (!playlistInfo) return null;
    return { ...playlistInfo, cover: playlistInfo.cover, totalSongs: tracks.length };
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

  return (
    <div
      key={playSourceId ?? playlistId ?? (dailyDate ? `daily:${dailyDate}` : "daily")}
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
          <>
            <PlaylistActions
              actionSlot={actionSlot}
              playlistId={playlistId}
              playSourceId={playSourceId}
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
          </>
        )}
        <div className="min-w-0 flex-1 pb-10">
          {isLoading ? (
            <PlaylistLoading />
          ) : contentSlot ? (
            contentSlot({ searchQuery })
          ) : (
            <TracklistTable
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={handleSearchOpen}
              onSearchClose={handleSearchClose}
              inputRef={inputRef}
              hideAlbumColumn={hideAlbumColumn}
              emptyActionLabel={t("common.action.reload")}
              onEmptyAction={handleRefreshTracks}
              onTracksChange={setTracks}
              playSourceId={playSourceId}
              readonly={readonly}
              stickyHeaderTop={DASHBOARD_HEADER_HEIGHT}
              tracks={tracks}
            />
          )}
        </div>
      </div>
    </div>
  );
}
