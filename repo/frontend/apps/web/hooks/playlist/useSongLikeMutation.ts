"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { useUserStore } from "@/store/module/user";
import { useI18n } from "@/store/module/i18n";
import type { SongLikeMutationVariables } from "@/types/api/playlist";

/**
 * 歌曲喜欢/取消喜欢 Mutation Hook。
 * 统一管理乐观更新、Store 状态同步、错误回滚以及关联 Query 缓存失效（包含喜欢歌单、用户歌单及歌单内容）。
 */
export function useSongLikeMutation() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return useMutation({
    meta: { operation: "playlist.song.like" },
    mutationFn: ({ like, songId }: SongLikeMutationVariables) => likeSong(songId, like),
    mutationKey: ["playlist", "song", "like"],
    onMutate: async ({ like, songId }) => {
      const store = useUserStore.getState();
      const current = Array.isArray(store.likeListIDs)
        ? store.likeListIDs.map((id) => Number(id))
        : [];
      const numericId = Number(songId);
      const nextList = like
        ? current.includes(numericId)
          ? current
          : [...current, numericId]
        : current.filter((id) => id !== numericId);

      store.setLikeListIDs(nextList);
      void clearPageCache();

      return { previousLikeListIDs: current };
    },
    onError: (error, variables, context) => {
      if (context?.previousLikeListIDs) {
        useUserStore.getState().setLikeListIDs(context.previousLikeListIDs);
      }
      reportActionFailure(`playlist.song.${variables.like ? "like" : "unlike"}`, error, {
        like: variables.like,
        songId: variables.songId,
      });
      if (!variables.silentToast) {
        toast.error(t("playlist.table.operationFailed"));
      }
    },
    onSuccess: async (_data, variables) => {
      if (!variables.silentToast) {
        toast.success(
          variables.like ? t("playlist.track.likedAdded") : t("playlist.track.likedRemoved"),
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["library", "liked-playlist"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["library", "playlists"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["playlist", "content"],
        }),
      ]);
      void clearPageCache();
    },
  });
}
