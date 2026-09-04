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
import { canRemoveTracksFromPlaylist } from "@/lib/playlist/playlistTrackRemovalPermission";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistContentProps } from "@/types/components/playlist";

export function PlaylistContent({
  actionSlot,
  commentResourceId,
  commentResourceKind,
  contentSlot,
  dailyDate,
  hideAlbumColumn,
  isDailyRecommend,
  isLoading,
  onDislikePersonalFm,
  onPlayToggle,
  onTrackPlay,
  playlistId,
  playlistInfo,
  playSourceId,
  readonly = false,
  refetchTracks,
  setTracks,
  showShuffle,
  themeColor,
  tracks,
}: PlaylistContentProps) {
  useRouteRestorationPlaceholder(PlaylistPageSkeleton);
  const { t } = useI18n();
  const currentUserId = useUserStore((state) => state.user?.userId ?? null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dynamicPlaylistInfo = useMemo(() => {
    if (!playlistInfo) return null;
    return { ...playlistInfo, cover: playlistInfo.cover, totalSongs: tracks.length };
  }, [playlistInfo, tracks.length]);
  const canRemoveFromPlaylist = canRemoveTracksFromPlaylist({
    creatorId: playlistInfo?.creatorID,
    currentUserId,
    // A selected daily date is history; both current and historical daily pages are
    // virtual recommendation surfaces and cannot call the playlist mutation endpoint.
    isDailyRecommendation: isDailyRecommend,
    isHistoricalDailyRecommendation: isDailyRecommend && Boolean(dailyDate),
    // Missing metadata is treated as virtual until the concrete playlist detail loads.
    isVirtualPlaylist: playlistInfo?.isSpecial ?? true,
    playlistId,
    readonly,
  });

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
      className="relative flex min-h-screen w-full flex-col bg-surface-raised font-sans"
    >
      {!isLoading && themeColor ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 opacity-60 md:h-125"
          style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
        />
      ) : null}
      {dynamicPlaylistInfo ? (
        <PlaylistHeader info={dynamicPlaylistInfo} isDaily={isDailyRecommend} />
      ) : (
        <PlaylistHeaderSkeleton showActions={isLoading} />
      )}
      <div className="hero-content-transition relative z-10 flex flex-1 flex-col">
        {!isLoading && (
          <>
            <PlaylistActions
              actionSlot={actionSlot}
              commentResourceId={commentResourceId}
              commentResourceKind={commentResourceKind}
              playlistId={playlistId}
              playlistInfo={dynamicPlaylistInfo}
              playSourceId={playSourceId}
              isDaily={isDailyRecommend}
              dailyDate={dailyDate}
              onPlayToggle={onPlayToggle}
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              showShuffle={showShuffle}
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
              canRemoveFromPlaylist={canRemoveFromPlaylist}
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={handleSearchOpen}
              onSearchClose={handleSearchClose}
              inputRef={inputRef}
              hideAlbumColumn={hideAlbumColumn}
              emptyActionLabel={t("common.action.reload")}
              onEmptyAction={handleRefreshTracks}
              onDislikePersonalFm={onDislikePersonalFm}
              onPlayTrack={onTrackPlay}
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
