export * from "./api/fansGroup";

/**
 * 视图层统一使用的乐迷团综合实体
 */
export interface ParsedArtistFansGroup {
  artistId: number;
  artistName: string;
  groupId: string;
  name: string;
  avatarUrl: string;
  targetUrl?: string;
  joined: boolean;
  userLevel?: string;
  userIntegral?: number;
  totalMembersCount?: number;
}
