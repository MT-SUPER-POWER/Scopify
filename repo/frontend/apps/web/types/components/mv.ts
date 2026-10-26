import type { NeteaseComment } from "@/types/api/music";
import type { ReactNode } from "react";
import type { MvArtist, MvDetail, MvResolution, MvSummary } from "@/types/api/mv";

export interface MvListItemProps {
  mv: MvSummary;
  /** 传入时渲染为链接；否则为按钮并调用 onSelect。 */
  href?: string;
  onSelect?: (mvId: number) => void;
  isActive?: boolean;
  /** 艺人前的小标签，例如「本曲 MV」。 */
  badge?: ReactNode;
  /** sm 用于窄面板，md 用于 MV 页侧栏。 */
  size?: "sm" | "md";
}

export interface MvCardProps {
  mv: MvSummary;
}

export interface MvPlayerProps {
  mvid: number;
  resolutions: MvResolution[];
  poster?: string;
  /** 播放下一个（相似 MV 的第一个）；播完也会自动调用。 */
  onNext?: () => void;
}

export interface MvProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
}

export interface MvVolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export interface MvQualityMenuProps {
  resolutions: number[];
  current: number;
  onChange: (resolution: number) => void;
}

export interface MvInfoProps {
  detail: MvDetail;
  isSubscribed: boolean;
}

export interface SongMvBadgeProps {
  /** 歌曲关联的 MV id；缺省或 0 时不渲染。 */
  mvId?: number;
}

export interface MvArtistAvatarProps {
  artistId?: number;
  name: string;
  className?: string;
}

export interface MvChannelProps {
  artist: Pick<MvArtist, "id" | "name">;
}

export interface MvCommentsProps {
  mvid: number;
}

export interface MvCardPreviewProps {
  mvid: number;
}

export interface MvCommentComposerProps {
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

export interface MvCommentItemProps {
  comment: NeteaseComment;
  isOwn: boolean;
  isReplying: boolean;
  canReply: boolean;
  onLike: () => void;
  onDelete: () => void;
  onReplyOpen: () => void;
  onReplyCancel: () => void;
  onReplySubmit: (text: string) => Promise<boolean>;
}
