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

/** 一层楼（某条评论下）的回复列表状态。 */
export interface CommentThread {
  comments: NeteaseComment[];
  hasMore: boolean;
  isLoading: boolean;
  /** 首页回复是否已取过，已取过就不再重复请求。 */
  loaded: boolean;
  /** 翻页用的游标，取自上一页返回的 time。 */
  time?: number;
  total: number;
}
