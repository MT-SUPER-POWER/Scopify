"use client";

import PlaylistActions from "@/components/Playlist/ActionStation";
import { PlaylistLatticeView } from "@/components/Playlist/lattice/PlaylistLatticeView";
import { PlaylistHero } from "@/components/Playlist/PlaylistHero";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { PlaylistTrackList } from "@/components/Playlist/PlaylistTrackList";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";
import { DASHBOARD_HEADER_HEIGHT } from "@/constants/layout";
import { usePlaylistContentPresentation } from "@/hooks/playlist/usePlaylistContentPresentation";
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
      )}
    </PlaylistLatticeView>
  );
}
