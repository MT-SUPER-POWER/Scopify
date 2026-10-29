import type { ReactNode } from "react";
import type { CommentResource } from "@/types/comment/api";
import type { NeteaseComment } from "@/types/song/api";

export interface CommentSectionProps {
  resource: CommentResource;
}

export interface CommentPageHeaderProps {
  resource: CommentResource;
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
  resource: CommentResource;
  parentId: number;
  replyCount: number;
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
  onArtistClick: (artistId: number | string) => void;
  tagLabel?: string;
}

export interface CommentHeaderSkeletonProps {
  tagLabel: string;
}
