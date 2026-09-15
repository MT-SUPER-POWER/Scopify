"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { fetchUserPlaylists } from "@/hooks/library/fetchUserPlaylists";
import { getPlaylsitDetail, updatePlaylistOrder, updateSongOrder } from "@/lib/api/playlist";
import { getPlaylistOrderIds } from "@/lib/playlist/playlistOrder";
import { clearPageCache } from "@/lib/cache/pageCache";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { prunePlaylist, type PlaylistContent } from "@/types/api/playlist";
import type { InlineOrderMove } from "@/types/playlistOrder";

export function usePlaylistOrderMutation() {
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.userId);
  const { t } = useI18n();
  const contentKey = (playlistId: string) => ["playlist", "content", "playlist", playlistId];
  return useMutation({
    retry: false,
    onMutate: (move: InlineOrderMove) =>
      queryClient.cancelQueries({
        queryKey: move.playlistId
          ? contentKey(move.playlistId)
          : musicQueryKeys.library.playlists(userId ?? 0),
      }),
    mutationFn: async ({ playlistId, fromId, toId, expectedIds }: InlineOrderMove) => {
      if (!userId || useUserStore.getState().user?.userId !== userId)
        throw new Error(t("sidebar.card.loginTitle"));
      let ids: number[];
      const playlists = playlistId ? undefined : await fetchUserPlaylists(userId);
      if (playlistId) {
        const { data } = await getPlaylsitDetail({ id: playlistId, requiresMusicSession: true });
        if (data.code !== 200 || data.playlist?.creator?.userId !== userId)
          throw new Error(t("playlist.order.notOwner"));
        ids = getPlaylistOrderIds(data.playlist.trackIds);
        if (data.playlist.trackCount !== undefined && ids.length !== data.playlist.trackCount)
          throw new Error(t("playlist.order.incomplete"));
      } else {
        if (!playlists) throw new Error(t("playlist.order.incomplete"));
        ids = [...playlists]
          .sort(
            (a, b) => Number(a.creator?.userId !== userId) - Number(b.creator?.userId !== userId),
          )
          .map((playlist) => {
            if (playlist.id === undefined) throw new Error(t("playlist.order.incomplete"));
            return playlist.id;
          });
        const from = playlists.find((playlist) => playlist.id === fromId);
        const to = playlists.find((playlist) => playlist.id === toId);
        if (
          !from ||
          !to ||
          from.specialType === 5 ||
          to.specialType === 5 ||
          (from.creator?.userId === userId) !== (to.creator?.userId === userId)
        )
          throw new Error(t("playlist.order.changed"));
      }
      // Missing song details must never cause their IDs to be dropped from the API payload.
      const visible = new Set(expectedIds);
      const currentVisible = ids.filter((id) => visible.has(id));
      if (
        currentVisible.length !== expectedIds.length ||
        currentVisible.some((id, index) => id !== expectedIds[index])
      ) {
        throw new Error(t("playlist.order.changed"));
      }
      const from = ids.indexOf(fromId);
      const to = ids.indexOf(toId);
      if (from < 0 || to < 0) throw new Error(t("playlist.order.changed"));
      if (
        playlists &&
        ids
          .slice(Math.min(from, to), Math.max(from, to) + 1)
          .some((id) => playlists.find((playlist) => playlist.id === id)?.specialType === 5)
      ) {
        throw new Error(t("playlist.order.changed"));
      }
      const orderedIds = arrayMove(ids, from, to);
      if (useUserStore.getState().user?.userId !== userId)
        throw new Error(t("sidebar.card.loginTitle"));
      if (playlistId) await updateSongOrder({ pid: playlistId, ids: orderedIds });
      else await updatePlaylistOrder({ ids: orderedIds });
      return { orderedIds, playlists };
    },
    onSuccess: async ({ orderedIds, playlists }, { playlistId }) => {
      if (!userId || useUserStore.getState().user?.userId !== userId) return;
      const ranks = new Map(orderedIds.map((id, index) => [id, index]));
      const rank = (id: number) => ranks.get(id) ?? Number.MAX_SAFE_INTEGER;
      const queryKey = playlistId
        ? contentKey(playlistId)
        : musicQueryKeys.library.playlists(userId);
      await queryClient.cancelQueries({ queryKey });
      if (useUserStore.getState().user?.userId !== userId) return;
      if (playlistId) {
        queryClient.setQueriesData<PlaylistContent>({ queryKey }, (content) =>
          content
            ? {
                ...content,
                rawDetail: { ...content.rawDetail, trackIds: orderedIds.map((id) => ({ id })) },
                tracks: [...content.tracks].sort((a, b) => rank(a.id) - rank(b.id)),
              }
            : content,
        );
      } else if (playlists) {
        const ordered = playlists.map(prunePlaylist).sort((a, b) => rank(a.id) - rank(b.id));
        queryClient.setQueryData(queryKey, ordered);
        useUserStore.setState({ playlist: ordered });
      }
      void queryClient.invalidateQueries({ queryKey, refetchType: "none" });
      void clearPageCache();
    },
    onError: (error) =>
      toast.error(t("playlist.order.reverted"), {
        description: error instanceof Error ? error.message : undefined,
      }),
  });
}
