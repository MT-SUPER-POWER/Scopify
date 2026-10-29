import type { ReactNode } from "react";
import type { UserFansGroupItem } from "@/types/fansGroup/api";
import type { UpdateUserProfilePayload } from "@/types/user/profileUpdateApi";
import type { NeteaseUser } from "@/types/user/api";
import type {
  SocialEvent,
  SocialComment,
  SocialResource,
  SocialUser,
  SocialPeopleMode,
  SocialEventTarget,
  SocialProfileTab,
  SocialProfile,
} from "@/types/social/model";

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
export interface SocialEventSource {
  name: string;
  href: string;
}
export interface SocialPostViewProps {
  event: SocialEvent;
  /** 动态被删除后关闭浮层 */
  onDeleted: () => void;
}
export interface SocialNoteTileProps {
  event: SocialEvent;
  source?: SocialEventSource;
}
export interface SocialNoteGridProps {
  items: SocialEvent[];
  /** 为每条动态提供来源标签（如聚合流中的所属乐迷团） */
  getSource?: (event: SocialEvent) => SocialEventSource | undefined;
}
export interface SocialEventActionsProps extends SocialEventProps {
  liking: boolean;
  onLike: () => void;
}
export interface SocialEventMenuProps extends SocialEventProps {
  pending: boolean;
  onDelete: (onSuccess: () => void) => void;
}
export interface SocialCommentRowProps {
  event: SocialEvent;
  comment: SocialComment;
  onReply: (comment: SocialComment) => void;
}
export interface SocialFeedProps {
  uid?: string;
  enabled?: boolean;
  /** 以瀑布流卡片展示；个人主页仍用完整列表 */
  grid?: boolean;
}
export interface SocialHeaderProps {
  view: "friends" | "hot" | "people";
  groupId: string;
  /** 当前用户加入的乐迷团；为空时第二个标签回退为「广场」。 */
  groups: UserFansGroupItem[];
}
export interface SocialFansGroupRailProps {
  groups: UserFansGroupItem[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}
export interface SocialFansGroupRailItemProps {
  active: boolean;
  label: string;
  title?: string;
  onSelect: () => void;
  /** 胶囊左侧的小头像；「全部」不传 */
  children?: ReactNode;
}
export interface SocialNotesFeedProps {
  groupId: string;
}
export interface SocialSearchFormProps {
  query?: string;
}
export interface SocialPostTextProps {
  text: string;
  expanded?: boolean;
}

export interface SocialInlineTextProps {
  text: string;
}
export interface SocialPeopleProps {
  uid?: string;
  mode: SocialPeopleMode;
  query?: string;
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
export interface SocialProfileHeroProps {
  user: SocialProfile;
  isSelf: boolean;
  onEdit: () => void;
  onMessage: () => void;
}
export interface ProfileListeningRankProps {
  uid: string;
}
export interface SocialProfileBodyProps {
  user: SocialProfile;
  tab: string;
  isSelf: boolean;
}
export type SocialProfileAsideProps = Pick<SocialProfileBodyProps, "user" | "isSelf">;
export interface EditUserProfileDialogProps {
  open: boolean;
  user: NeteaseUser;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (payload: UpdateUserProfilePayload) => Promise<void>;
}
