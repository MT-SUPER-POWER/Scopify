import type { NeteaseComment } from "@/types/song/api";
import type { CommentHeaderArtist } from "@/types/comment/components";

export interface CommentResourceHeaderData {
  albumName?: string;
  artists: CommentHeaderArtist[];
  coverUrl: string;
  title: string;
}

export interface CommentPreviewListProps {
  comments: NeteaseComment[];
  className?: string;
}

export type CommentSortType = "hot" | "latest";

/** 评论列表的一页（/comment/new）。 */
export interface CommentListPage {
  comments: NeteaseComment[];
  cursor?: number | string;
  hasMore: boolean;
  total: number;
}

/** 评论列表的翻页参数：推荐排序按页码，时间排序按上一页返回的游标。 */
export interface CommentListPageParam {
  cursor?: number | string;
  pageNo: number;
}

/** 一层楼（某条评论下）的回复的一页（/comment/floor）。 */
export interface CommentRepliesPage {
  comments: NeteaseComment[];
  hasMore: boolean;
  /** 翻下一页用的游标。 */
  time?: number;
  total: number;
}

/** 楼中楼的翻页参数：首页少取几条，之后按游标往后取。 */
export interface CommentRepliesPageParam {
  limit: number;
  time?: number;
}
