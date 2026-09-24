"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { canRemoveTracksFromPlaylist } from "@/lib/playlist/playlistTrackRemovalPermission";
import { useUserStore } from "@/store";
import type { PlaylistContentPresentationOptions } from "@/types/components/playlist";

export function usePlaylistContentPresentation({
  playlistInfo,
  tracks,
  playlistId,
  isDailyRecommend,
  dailyDate,
  readonly,
  refetchTracks,
}: PlaylistContentPresentationOptions) {
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

  return {
    searchOpen,
    searchQuery,
    setSearchQuery,
    inputRef,
    dynamicPlaylistInfo,
    canRemoveFromPlaylist,
    handleSearchOpen,
    handleSearchClose,
    handleRefreshTracks,
  };
}
