import type { useCommentData } from "@/hooks/comment/useCommentData";
import type { NeteaseComment } from "@/types/song/api";

export type CommentSortType = "hot" | "latest";

export type CommentThreadData = ReturnType<typeof useCommentData>;

export interface CommentSectionProps {
  data: CommentThreadData;
  /** 传入时在标题行右侧显示「在评论页查看」链接（嵌入其他页面时使用）。 */
  openPageHref?: string;
}

export interface CommentHeaderArtist {
  id: number | string;
  name: string;
  avatarUrl?: string;
}

export interface CommentHeaderProps {
  coverUrl: string;
  title: string;
  albumName?: string;
  artists: CommentHeaderArtist[];
  total: number;
  onArtistClick: (artistId: number | string) => void;
  tagLabel?: string;
}

export interface CommentHeaderSkeletonProps {
  tagLabel: string;
}

export interface CommentItemProps {
  comment: NeteaseComment;
  isHot?: boolean;
  currentUserId?: number | string | null;
  onLike?: (id: number, isHot: boolean) => void;
  onDelete?: (id: number) => void;
  onReply?: (id: number) => void;
  onReport?: (id: number) => void;
  onRouterClick?: (url: string) => void;
}

export interface CommentInputBoxProps {
  replyTarget: NeteaseComment | null;
  onCancelReply: () => void;
  onSubmit: (text: string) => Promise<boolean>;
}
