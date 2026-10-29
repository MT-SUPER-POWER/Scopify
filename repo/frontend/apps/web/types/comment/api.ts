import type { NeteaseComment } from "@/types/song/api";

export const COMMENT_RESOURCE_TYPE = {
  song: 0,
  mv: 1,
  playlist: 2,
  album: 3,
  voice: 4,
  "voice-list": 7,
} as const;

export type CommentResourceKind = keyof typeof COMMENT_RESOURCE_TYPE;
export type CommentResourceType = (typeof COMMENT_RESOURCE_TYPE)[CommentResourceKind];

/** 评论所属资源；评论页从 URL 解析，嵌入式评论区（如 MV 页）直接传入。 */
export interface CommentResourceRef {
  kind: CommentResourceKind;
  id: string;
}

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
