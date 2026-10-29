import type { ReactNode } from "react";
import type { useCommentData } from "@/hooks/comment/useCommentData";
import type { CommentThread } from "@/types/comment/model";
import type { NeteaseComment } from "@/types/song/api";

export type CommentThreadData = ReturnType<typeof useCommentData>;

export interface CommentSectionProps {
  data: CommentThreadData;
  /** 传入时在标题行右侧显示「在评论页查看」链接（嵌入其他页面时使用）。 */
  openPageHref?: string;
}

export interface CommentComposerProps {
  placeholder: string;
  submitLabel: string;
  /** 回复时的紧凑尺寸（小头像）。 */
  compact?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  /** 返回是否成功；成功后清空输入。 */
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
}

export interface CommentRowProps {
  comment: NeteaseComment;
  isOwn: boolean;
  isReplying: boolean;
  canReply: boolean;
  /** 楼中楼里的回复：小头像，回复楼主的引用不再重复显示。 */
  compact?: boolean;
  /** 所在楼的根评论 id，用来判断一条回复是回复楼主还是回复别的回复。 */
  rootId?: number;
  /** 有回复时，头像下方画一条通向「N 条回复」的引导线。 */
  hasReplies?: boolean;
  onLike: () => void;
  onDelete: () => void;
  onReplyOpen: () => void;
  onReplyCancel: () => void;
  onReplySubmit: (text: string) => Promise<boolean>;
  /** 楼中楼：作为网格的后续行放在正文下方。 */
  children?: ReactNode;
}

export interface CommentRepliesProps {
  parentId: number;
  replyCount: number;
  thread: CommentThread | undefined;
  onLoad: (parentId: number, more?: boolean) => void;
  renderReply: (reply: NeteaseComment) => ReactNode;
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
