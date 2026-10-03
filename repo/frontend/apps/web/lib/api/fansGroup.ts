import request from "@/lib/web/request";
import type { FansGroupDetailResponse, UserFansGroupsResponse } from "@/types/api/fansGroup";

/**
 * 获取当前登录用户已加入的全部歌手乐迷团列表
 */
export function getUserFansGroups() {
  return request.get<UserFansGroupsResponse>("/fans/group/user/groups");
}

/**
 * 获取指定乐迷团详情
 * @param groupId 乐迷团 ID
 * @param scene 场景标识（可选）
 */
export function getFansGroupDetail(groupId: string | number, scene?: string) {
  return request.get<FansGroupDetailResponse>("/fans/group/detail", {
    params: { groupId, scene },
  });
}
