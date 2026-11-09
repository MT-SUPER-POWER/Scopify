import type { MusicCommentTargetKind } from "@scopify/music-domain/comment";
import type { NeteaseComment } from "@/types/song/api";

/** NetEase's numeric resource type for each kind of comment thread. */
export const NETEASE_COMMENT_TYPE = {
  track: 0,
  mv: 1,
  playlist: 2,
  album: 3,
  voice: 4,
  "voice-list": 7,
} as const satisfies Record<MusicCommentTargetKind, number>;

export type CommentResourceType = (typeof NETEASE_COMMENT_TYPE)[MusicCommentTargetKind];

export interface MusicCommentParams {
  id: number | string;
  limit?: number;
  offset?: number;
  before?: number;
}

export interface NewCommentParams {
  cursor?: number | string;
  id: number | string;
  pageNo?: number;
  pageSize?: number;
  sortType?: 1 | 2 | 3;
  type: CommentResourceType;
}

export interface FloorCommentParams {
  id: number | string;
  limit?: number;
  parentCommentId: number | string;
  /** 上一页返回的 data.time，翻页用。 */
  time?: number;
  type: CommentResourceType;
}

export interface FloorCommentResponse {
  code: number;
  data?: {
    comments?: NeteaseComment[];
    hasMore?: boolean;
    time?: number;
    totalCount?: number;
  };
  message?: string;
}

export interface NewCommentResponse {
  code: number;
  data?: {
    comments?: NeteaseComment[];
    cursor?: number | string;
    hasMore?: boolean;
    totalCount?: number;
  };
  message?: string;
}
