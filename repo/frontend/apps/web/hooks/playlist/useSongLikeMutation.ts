"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import {
  createDefaultDependencies,
  createSongLikeMutationOptions,
} from "@/lib/playlist/songLikeMutation";

/**
 * 歌曲喜欢/取消喜欢 Mutation Hook。
 * 统一管理乐观更新、Store 状态同步、错误回滚以及关联 Query 缓存失效（包含喜欢歌单、用户歌单及歌单内容）。
 * 喜欢状态属于某个平台的某个账号，乐观更新只改动该账号缓存的喜欢列表。
 */
export function useSongLikeMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { account } = useLibraryAccount();
  const accountProvider = account?.provider;
  const accountId = account?.accountId;
  const dependencies = useMemo(
    () =>
      createDefaultDependencies((provider) =>
        provider === accountProvider && accountId ? accountId : null,
      ),
    [accountId, accountProvider],
  );

  return useMutation(
    createSongLikeMutationOptions(
      queryClient,
      {
        failure: t("playlist.table.operationFailed"),
        liked: t("playlist.track.likedAdded"),
        unliked: t("playlist.track.likedRemoved"),
      },
      dependencies,
    ),
  );
}
