import type { NeteaseComment } from "@/types/api/music";

export const COMMENT_RESOURCE_TYPE = {
  song: 0,
  playlist: 2,
  album: 3,
  voice: 4,
  "voice-list": 7,
} as const;

export type CommentResourceKind = keyof typeof COMMENT_RESOURCE_TYPE;
export type CommentResourceType = (typeof COMMENT_RESOURCE_TYPE)[CommentResourceKind];

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
