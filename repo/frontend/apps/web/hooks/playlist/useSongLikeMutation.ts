"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSongLikeMutationOptions } from "@/lib/playlist/songLikeMutation";
import { useI18n } from "@/store/module/i18n";

/**
 * 歌曲喜欢/取消喜欢 Mutation Hook。
 * 统一管理乐观更新、Store 状态同步、错误回滚以及关联 Query 缓存失效（包含喜欢歌单、用户歌单及歌单内容）。
 */
export function useSongLikeMutation() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return useMutation(
    createSongLikeMutationOptions(queryClient, {
      failure: t("playlist.table.operationFailed"),
      liked: t("playlist.track.likedAdded"),
      unliked: t("playlist.track.likedRemoved"),
    }),
  );
}
