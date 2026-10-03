"use client";

import { useQuery } from "@tanstack/react-query";
import { getFansGroupDetail, getUserFansGroups } from "@/lib/api/fansGroup";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store/module/user";
import type { UserFansGroupItem } from "@/types/api/fansGroup";

export interface UseUserFansGroupsOptions {
  enabled?: boolean;
}

/**
 * 查询当前登录用户已加入的所有歌手乐迷团列表
 */
export function useUserFansGroupsQuery(options: UseUserFansGroupsOptions = {}) {
  const uid = useUserStore((s) => s.user?.userId);
  const isEnabled = (options.enabled ?? true) && Boolean(uid);

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.fansGroup.userGroups(uid),
    queryFn: async () => {
      const response = await getUserFansGroups();
      return response.data?.data?.groups ?? [];
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
  });
}

export interface UseFansGroupDetailOptions {
  enabled?: boolean;
  scene?: string;
}

/**
 * 根据乐迷团 ID 查询乐迷团详情
 * @param groupId 乐迷团 ID
 * @param options 查询配置项
 */
export function useFansGroupDetailQuery(
  groupId: number | string | null | undefined,
  options: UseFansGroupDetailOptions = {},
) {
  const normalizedId = groupId ? String(groupId) : "";
  const isEnabled = (options.enabled ?? true) && Boolean(normalizedId);

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.fansGroup.detail(normalizedId),
    queryFn: async () => {
      if (!normalizedId) throw new Error("groupId is required");
      const response = await getFansGroupDetail(normalizedId, options.scene);
      return response.data?.data?.fansGroupInfo ?? null;
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
  });
}

/**
 * 聚合状态 Hook：根据歌手 ID 获取当前登录用户在与该歌手相关的乐迷团中的入团状态
 * @param artistId 歌手 ID
 */
export function useArtistFansGroupStatus(artistId: number | string | null | undefined) {
  const normalizedId = artistId ? String(artistId) : "";
  const userGroupsQuery = useUserFansGroupsQuery();
  const userJoinedGroups: UserFansGroupItem[] = userGroupsQuery.data ?? [];

  // 判断当前登录用户是否在已加入乐迷团列表中
  const joinedGroup = userJoinedGroups.find((group) => String(group.headId) === normalizedId);

  return {
    joinedGroup: joinedGroup ?? null,
    isJoined: Boolean(joinedGroup),
    fansGroupId: joinedGroup?.fansGroupId ?? null,
    level: joinedGroup?.userLevel?.level ?? null,
    nameplate: joinedGroup?.userFansNameplate ?? null,
    totalMembersCount: joinedGroup?.totalMembersCount,
    isLoading: userGroupsQuery.isLoading,
    isError: userGroupsQuery.isError,
    refetch: async () => {
      await userGroupsQuery.refetch();
    },
  };
}
