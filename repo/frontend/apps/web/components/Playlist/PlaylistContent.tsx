"use client";

import PlaylistActions from "@/components/Playlist/ActionStation";
import { PlaylistLatticeView } from "@/components/Playlist/lattice/PlaylistLatticeView";
import { PlaylistHero } from "@/components/Playlist/PlaylistHero";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { PlaylistTrackList } from "@/components/Playlist/PlaylistTrackList";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";
import { DASHBOARD_MAIN_STICKY_TOP } from "@/constants/layout";
import { usePlaylistContentPresentation } from "@/hooks/playlist/usePlaylistContentPresentation";
import { useTranslation } from "react-i18next";

import type { PlaylistContentProps } from "@/types/playlist/components";

export function PlaylistContent({
  actionSlot,
  trailingActionSlot,
  commentResourceId,
  commentResourceKind,
  contentSlot,
  dailyDate,
  dateColumnLabel,
  hideAlbumColumn,
  isDailyRecommend,
  isLoading,
  onDislikePersonalFm,
  cloudActions,
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
  const { t } = useTranslation();
  const {
    searchOpen,
    searchQuery,
    setSearchQuery,
    inputRef,
    dynamicPlaylistInfo,
    canRemoveFromPlaylist,
    handleSearchOpen,
    handleSearchClose,
    handleRefreshTracks,
  } = usePlaylistContentPresentation({
    playlistInfo,
    tracks,
    playlistId,
    isDailyRecommend,
    dailyDate,
    readonly,
    refetchTracks,
  });
  const sourceId = playSourceId ?? playlistId ?? (dailyDate ? `daily:${dailyDate}` : "daily");
  return (
    <PlaylistLatticeView
      key={sourceId}
      tracks={tracks}
      title={dynamicPlaylistInfo?.title ?? t("playlist.actions.listLabel")}
      sourceId={sourceId}
      onTrackPlay={onTrackPlay}
    >
      {(openLattice) => (
        <div className="relative flex min-h-screen w-full flex-col bg-surface-raised font-sans">
          <PlaylistHero
            isLoading={isLoading}
            themeColor={themeColor}
            playlistInfo={dynamicPlaylistInfo}
            isDailyRecommend={isDailyRecommend}
          />
          <div className="hero-content-transition relative z-10 flex flex-1 flex-col">
            {!isLoading && (
              <div data-track-drag-chrome>
                <PlaylistActions
                  actionSlot={actionSlot}
                  trailingActionSlot={trailingActionSlot}
                  commentResourceId={commentResourceId}
                  commentResourceKind={commentResourceKind}
                  playlistId={playlistId}
                  playlistInfo={dynamicPlaylistInfo}
                  playSourceId={playSourceId}
                  isDaily={isDailyRecommend}
                  dailyDate={dailyDate}
                  onPlayToggle={onPlayToggle}
                  onOpenLattice={openLattice}
                  searchOpen={searchOpen}
                  searchQuery={searchQuery}
                  showShuffle={showShuffle}
                  onSearchChange={setSearchQuery}
                  onSearchOpen={handleSearchOpen}
                  onSearchClose={handleSearchClose}
                  inputRef={inputRef}
                  tracks={tracks}
                />
              </div>
            )}
            <div className="min-w-0 flex-1 pb-10">
              {isLoading ? (
                <PlaylistLoading />
              ) : contentSlot ? (
                contentSlot({ searchQuery })
              ) : (
                <PlaylistTrackList
                  key={playlistId ?? playSourceId ?? "virtual"}
                  playlistId={playlistId}
                  canRemoveFromPlaylist={canRemoveFromPlaylist}
                  searchOpen={searchOpen}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearchOpen={handleSearchOpen}
                  onSearchClose={handleSearchClose}
                  inputRef={inputRef}
                  hideAlbumColumn={hideAlbumColumn}
                  dateColumnLabel={dateColumnLabel}
                  emptyActionLabel={t("common.action.reload")}
                  onEmptyAction={handleRefreshTracks}
                  onDislikePersonalFm={onDislikePersonalFm}
                  cloudActions={cloudActions}
                  onPlayTrack={onTrackPlay}
                  onTracksChange={setTracks}
                  playSourceId={playSourceId}
                  readonly={readonly}
                  stickyHeaderTop={DASHBOARD_MAIN_STICKY_TOP}
                  tracks={tracks}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </PlaylistLatticeView>
  );
}
