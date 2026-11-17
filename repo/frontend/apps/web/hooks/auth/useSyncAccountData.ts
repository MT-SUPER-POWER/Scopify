"use client";

import type { MusicAccountRef, MusicProvider } from "@scopify/music-domain/identity";
import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { qqAccountQueryOptions } from "@/hooks/auth/useQqAccount";
import { libraryPlaylistsOptions } from "@/hooks/library/useLibraryPlaylists";
import { likedTrackIdsOptions } from "@/hooks/library/useLikedTracks";
import { getMusicProvider } from "@/lib/providers";
import { getQqSessionToken } from "@/lib/providers/qq/session";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import { syncUserSessionFromCookie } from "@/lib/web/sessionHydration";
import { useUserStore } from "@/store/module/user";

const SYNC_ACCOUNT_KEY = ["account", "sync"] as const;

export function useSyncAccountData() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const pending = useMutationState({
    filters: { mutationKey: SYNC_ACCOUNT_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables,
  })[0];
  const { mutate } = useMutation({
    mutationKey: SYNC_ACCOUNT_KEY,
    networkMode: "always",
    mutationFn: async (providerId: MusicProvider) => {
      const readCredential = providerId === "qq" ? getQqSessionToken : getMusicSessionCredential;
      const credential = readCredential();
      if (!credential) return false;

      const sessionChanged = () => readCredential() !== credential;
      try {
        let accountId: string | undefined;
        if (providerId === "qq") {
          const profile = await queryClient.fetchQuery({ ...qqAccountQueryOptions, staleTime: 0 });
          accountId = profile.accountId;
        } else if (await syncUserSessionFromCookie(true)) {
          accountId = useUserStore.getState().user?.userId.toString();
        }
        if (sessionChanged()) return false;
        if (!accountId) throw new Error("Could not refresh the account profile.");

        const account: MusicAccountRef = { accountId, provider: providerId };
        const provider = getMusicProvider(providerId);
        const [playlists] = await Promise.all([
          queryClient.fetchQuery({ ...libraryPlaylistsOptions(provider, account), staleTime: 0 }),
          queryClient.fetchQuery({ ...likedTrackIdsOptions(provider, account), staleTime: 0 }),
          providerId === "netease"
            ? queryClient.invalidateQueries(
                {
                  queryKey: musicQueryKeys.library.neteasePlaylists(Number(accountId)),
                  exact: true,
                },
                { throwOnError: true },
              )
            : Promise.resolve(),
        ]);
        if (sessionChanged()) return false;

        const likedPlaylist = playlists.find((item) => item.isLikedList) ?? null;
        queryClient.setQueryData(
          musicQueryKeys.library.likedPlaylist(providerId, accountId),
          likedPlaylist,
        );
        if (likedPlaylist) {
          await queryClient.invalidateQueries({
            queryKey: musicQueryKeys.playlist.contentOf(providerId, likedPlaylist.playlist.ref.id),
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
    isSyncing: pending !== undefined,
    syncingProvider: pending,
    syncAccountData: (provider: MusicProvider) => {
      if (!queryClient.isMutating({ mutationKey: SYNC_ACCOUNT_KEY })) mutate(provider);
    },
  };
}
