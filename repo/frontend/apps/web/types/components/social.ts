import type { ReactNode } from "react";
import type { UpdateUserProfilePayload } from "@/types/api/profileUpdate";
import type { NeteaseUser } from "@/types/api/user";
import type {
  SocialEvent,
  SocialComment,
  SocialResource,
  SocialUser,
  SocialPeopleMode,
  SocialEventTarget,
  SocialProfileTab,
} from "@/types/social";

export interface SocialUserProps {
  user: SocialUser;
  className?: string;
}
export interface SocialAvatarProps extends SocialUserProps {
  size?: "small" | "large";
  linked?: boolean;
}
export interface SocialResourceProps {
  resource: SocialResource;
  compact?: boolean;
}
export interface SocialEventProps {
  event: SocialEvent;
  quoted?: boolean;
  detail?: boolean;
}
export interface SocialCommentRowProps {
  event: SocialEvent;
  comment: SocialComment;
  onReply: (comment: SocialComment) => void;
}
export interface SocialFeedProps {
  uid?: string;
  enabled?: boolean;
}
export interface SocialPeopleProps {
  uid?: string;
  mode: SocialPeopleMode;
  query?: string;
  compact?: boolean;
}
export interface SocialComposerProps {
  forwarded?: SocialEvent;
  onDone?: () => void;
}
export interface SocialStateProps {
  loading?: boolean;
  error?: boolean;
  empty?: string;
  onRetry?: () => void;
  children?: ReactNode;
}
export interface SocialLoadMoreProps {
  more: boolean;
  pending: boolean;
  error?: boolean;
  onLoad: () => void;
}
export interface SocialDialogProps {
  open: boolean;
  onClose: () => void;
}
export interface SocialForwardDialogProps extends SocialDialogProps {
  event: SocialEvent;
}
export interface SocialMessageDialogProps extends SocialDialogProps {
  user: SocialUser;
}
export interface SocialEventDetailProps {
  target: SocialEventTarget;
}
export interface SocialResourcePickerProps extends SocialDialogProps {
  onSelect: (resource: SocialResource) => void;
}
export interface SocialProfileContentProps {
  uid: string;
  tab: SocialProfileTab;
  isSelf: boolean;
}
export interface EditUserProfileDialogProps {
  open: boolean;
  user: NeteaseUser;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (payload: UpdateUserProfilePayload) => Promise<void>;
}
