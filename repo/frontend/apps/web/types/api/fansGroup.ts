/**
 * 乐迷团用户等级信息
 */
export interface FansGroupUserLevel {
  level: string;
  segment: string;
  segmentCode: string;
  levelIntegral: number;
  fanTitle?: string | null;
  levelMedalIconUrl?: string | null;
  medalPicText?: string | null;
  levelLightImageUrl?: string | null;
  medalCode?: string | null;
  showUpgrade?: boolean;
}

/**
 * 乐迷团粉丝铭牌信息
 */
export interface FansGroupNameplate {
  type: string;
  text: string;
  level: string;
  levelUrl: string;
  backgroundUrl: string;
  backgroundEdgeUrl?: string;
  target?: string;
  wearingNameplate: boolean;
  fansGroupId: number | string;
  userId?: number;
}

/**
 * 用户已加入的单个乐迷团项
 */
export interface UserFansGroupItem {
  fansGroupId: string;
  headId: number;
  headIdType: "ARTIST_ID" | string;
  artistName: string;
  fansGroupName: string;
  fansGroupPureName?: string;
  fansNameplate?: string;
  headAvatarUrl: string;
  headHomepageUrl?: string;
  fansGroupInternalPageUrl?: string;
  userLevel?: FansGroupUserLevel;
  userIntegral?: string;
  userFansNameplate?: FansGroupNameplate;
  userActive?: boolean;
  totalMembersCount?: number;
  activeMembersCount?: number;
  brief?: string;
  showMsg?: string;
}

/**
 * 用户加入的全部乐迷团响应
 */
export interface UserFansGroupsResponse {
  code: number;
  data: {
    groups: UserFansGroupItem[];
  };
  message?: string | null;
}

/**
 * 乐迷团详情响应数据
 */
export interface FansGroupDetailInfo {
  fansGroupId: string;
  headId: number;
  headIdType: string;
  headAvatarUrl: string;
  artistName: string;
  fansGroupName: string;
  fansGroupPureName?: string;
  fansNameplate?: string;
  headHomepageUrl?: string;
  boardId?: string;
  topicId?: string;
  totalMembersCount?: number;
  activeMembersCount?: number;
}

export interface FansGroupDetailResponse {
  code: number;
  data: {
    fansGroupInfo: FansGroupDetailInfo;
  };
  message?: string;
}
