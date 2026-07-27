"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getUserLikeLists, getUserPlaylist } from "@/lib/api/playlist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { getBackendBaseUrl } from "@/lib/web/request";
import { waitForBackend } from "@/lib/web/waitForBackend";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

export function useSidebarPlaylists() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);
  const libraryUpdateTrigger = useUserStore((state) => state.libraryUpdateTrigger);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPlaylists = useCallback(
    async (isSilent = false) => {
      if (!isLoggedIn || !userId) return;

      if (!isSilent) setIsLoading(true);
      setError(null);

      try {
        const backendReady = await waitForBackend(getBackendBaseUrl(), 10_000);
        if (!backendReady) toast.warning(t("sidebar.toast.backendNotReady"));

        const [playlistResponse, likeListResponse] = await Promise.all([
          getUserPlaylist(userId),
          getUserLikeLists(userId),
        ]);
        const store = useUserStore.getState();
        store.setPlayList(playlistResponse.data.playlist);
        store.setLikeListIDs(likeListResponse.data.ids ?? []);
      } catch (cause) {
        console.error("Failed to load sidebar playlists", cause);
        if (!isSilent) {
          setError(cause instanceof Error ? cause.message : t("sidebar.card.loadFailed"));
          toast.error(t("sidebar.toast.fetchFailed"));
        }
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    },
    [isLoggedIn, t, userId],
  );

  useEffect(() => {
    if (isLoggedIn && userId) void loadPlaylists(libraryUpdateTrigger > 0);
  }, [isLoggedIn, libraryUpdateTrigger, loadPlaylists, userId]);

  return {
    error,
    isLoading,
    reload: () => loadPlaylists(false),
  };
}
