import type { MusicComment } from "@scopify/music-domain/comment";

/** The resource kinds a comment page or section is addressed by (`?resource=<kind>&id=`). */
export const COMMENT_RESOURCE_KINDS = [
  "song",
  "mv",
  "playlist",
  "album",
  "voice",
  "voice-list",
] as const;

export type CommentResourceKind = (typeof COMMENT_RESOURCE_KINDS)[number];

/** 评论所属资源；评论页从 URL 解析，嵌入式评论区（如 MV 页）直接传入。 */
export interface CommentResource {
  kind: CommentResourceKind;
  id: string;
}

export interface CommentPreviewListProps {
  comments: readonly MusicComment[];
  className?: string;
}

export type CommentSortType = "hot" | "latest";

/** 评论列表的翻页参数：推荐排序按页码，时间排序按上一页返回的游标。 */
export interface CommentListPageParam {
  cursor?: string;
  pageNo: number;
}

/** 楼中楼的翻页参数：首页少取几条，之后按游标往后取。 */
export interface CommentRepliesPageParam {
  limit: number;
  cursor?: string;
}
