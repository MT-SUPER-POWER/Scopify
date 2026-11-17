"use client";

import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { userLikedSongIdsOptions, userPlaylistsOptions } from "@/hooks/library/useLibraryQueries";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import { syncUserSessionFromCookie } from "@/lib/web/sessionHydration";
import { useUserStore } from "@/store/module/user";
import type { RawNeteasePlaylist } from "@/types/playlist/api";

const SYNC_ACCOUNT_KEY = ["account", "sync"] as const;

export function useSyncAccountData() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isSyncing = useIsMutating({ mutationKey: SYNC_ACCOUNT_KEY }) > 0;
  const { mutate } = useMutation({
    mutationKey: SYNC_ACCOUNT_KEY,
    networkMode: "always",
    mutationFn: async () => {
      const credential = getMusicSessionCredential();
      if (!credential) return false;

      const sessionChanged = () => getMusicSessionCredential() !== credential;
      try {
        const synced = await syncUserSessionFromCookie(true);
        if (sessionChanged()) return false;
        const userId = useUserStore.getState().user?.userId;
        if (!synced || !userId) throw new Error("Could not refresh the account profile.");

        const likedPlaylistKey = musicQueryKeys.library.likedPlaylist(userId);
        const [playlists] = await Promise.all([
          queryClient.fetchQuery({ ...userPlaylistsOptions(userId), staleTime: 0 }),
          queryClient.fetchQuery({ ...userLikedSongIdsOptions(userId), staleTime: 0 }),
          queryClient.invalidateQueries({ queryKey: likedPlaylistKey, exact: true }),
        ]);
        if (sessionChanged()) return false;

        useUserStore.setState({ playlist: playlists });
        const likedPlaylist = queryClient.getQueryData<RawNeteasePlaylist | null>(likedPlaylistKey);
        if (likedPlaylist?.id) {
          await queryClient.invalidateQueries({
            queryKey: musicQueryKeys.playlist.content(String(likedPlaylist.id), false),
            exact: true,
          });
        }
        return !sessionChanged();
      } catch (error) {
        if (sessionChanged()) return false;
        throw error;
      }
    },
    onSuccess: (synced) => {
      if (synced) toast.success(t("profile.toast.syncSuccess"));
    },
    onError: () => toast.error(t("profile.toast.syncFailed")),
  });

  return {
    isSyncing,
    syncAccountData: () => {
      if (!queryClient.isMutating({ mutationKey: SYNC_ACCOUNT_KEY })) mutate();
    },
  };
}
