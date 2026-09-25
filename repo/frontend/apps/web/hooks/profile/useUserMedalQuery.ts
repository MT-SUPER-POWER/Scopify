"use client";

import { useQuery } from "@tanstack/react-query";

import { getUserMedals } from "@/lib/api/user";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export interface UseUserMedalQueryOptions {
  enabled?: boolean;
}

/**
 * 用户徽章 Query Hook
 * 传入用户 id, 获取用户徽章
 * @param userId - 用户 ID
 * @param options - 配置项
 */
export function useUserMedalQuery(
  userId: number | string | null | undefined,
  options: UseUserMedalQueryOptions = {},
) {
  const normalizedUid = userId ? String(userId) : "";
  const isEnabled = (options.enabled ?? true) && Boolean(normalizedUid);

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.user.medal(normalizedUid),
    queryFn: async ({ signal }) => {
      if (!normalizedUid) throw new Error("User ID is required");
      const response = await getUserMedals(normalizedUid, signal);
      return response.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
  });
}
