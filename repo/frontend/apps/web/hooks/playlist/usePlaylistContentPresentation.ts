"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { canRemoveTracksFromPlaylist } from "@/lib/playlist/playlistTrackRemovalPermission";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import type { PlaylistContentPresentationOptions } from "@/types/playlist/components";

export function usePlaylistContentPresentation({
  playlistInfo,
  tracks,
  playlistId,
  isDailyRecommend,
  dailyDate,
  readonly,
  refetchTracks,
}: PlaylistContentPresentationOptions) {
  // The signed-in account of the active platform, whichever platform that is.
  const account = useActiveAccount();
  const currentUserId = account.isLoggedIn ? (account.profile?.accountId ?? null) : null;
  const canManagePlaylists = useProviderCapability("playlist.manage");
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
    readonly: readonly || !canManagePlaylists,
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
