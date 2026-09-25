"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  editUserSocialStatus,
  getRcmdSocialStatusUsers,
  getSupportSocialStatuses,
  getUserSocialStatus,
} from "@/lib/api/user";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store/module/user";
import type { UserSocialStatusEditParams } from "@/types/api/userSocialStatus";

export interface UseUserSocialStatusQueryOptions {
  enabled?: boolean;
}

/**
 * 用户状态 Query Hook
 * 登录后调用此接口, 传入用户 id, 获取用户状态
 * @param userId - 用户 ID
 * @param options - 配置项
 */
export function useUserSocialStatusQuery(
  userId: number | string | null | undefined,
  options: UseUserSocialStatusQueryOptions = {},
) {
  const isLogged = useUserStore((state) => Boolean(state.user?.userId));
  const normalizedUid = userId ? String(userId) : "";
  const isEnabled = (options.enabled ?? true) && Boolean(normalizedUid) && isLogged;

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.user.socialStatus(normalizedUid),
    queryFn: async ({ signal }) => {
      if (!normalizedUid) throw new Error("User ID is required");
      const response = await getUserSocialStatus(normalizedUid, signal);
      return response.data;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * 支持设置的用户状态列表 Query Hook
 * 登录后调用此接口, 获取支持设置的状态
 * @param options - 配置项
 */
export function useUserSocialStatusSupportQuery(options: UseUserSocialStatusQueryOptions = {}) {
  const isLogged = useUserStore((state) => Boolean(state.user?.userId));
  const isEnabled = (options.enabled ?? true) && isLogged;

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.user.socialStatusSupport(),
    queryFn: async ({ signal }) => {
      const response = await getSupportSocialStatuses(signal);
      return response.data;
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}

/**
 * 相同状态的用户 Query Hook
 * 登录后调用此接口, 获取相同状态的用户
 * @param options - 配置项
 */
export function useUserSocialStatusRcmdQuery(options: UseUserSocialStatusQueryOptions = {}) {
  const isLogged = useUserStore((state) => Boolean(state.user?.userId));
  const isEnabled = (options.enabled ?? true) && isLogged;

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.user.socialStatusRcmd(),
    queryFn: async ({ signal }) => {
      const response = await getRcmdSocialStatusUsers(signal);
      return response.data;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * 用户状态编辑 Mutation Hook
 * 登录后调用此接口, 编辑当前用户状态
 */
export function useEditUserSocialStatusMutation() {
  const queryClient = useQueryClient();
  const currentUserId = useUserStore((state) => state.user?.userId);

  return useMutation({
    mutationFn: (params: UserSocialStatusEditParams) => editUserSocialStatus(params),
    onSuccess: () => {
      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.user.socialStatus(currentUserId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: musicQueryKeys.user.socialStatusRcmd(),
      });
    },
  });
}
