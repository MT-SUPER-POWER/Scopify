import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { ReactNode } from "react";
import type { MusicMv, MusicMvDetail } from "@scopify/music-domain/mv";
import type { MvSummary } from "@/types/providers/netease/mvApi";

export interface MvListItemProps {
  mv: MusicMv;
  /** 传入时渲染为链接；否则为按钮并调用 onSelect。 */
  href?: string;
  onSelect?: (mvId: string) => void;
  isActive?: boolean;
  /** 艺人前的小标签，例如「本曲 MV」。 */
  badge?: ReactNode;
  /** sm 用于窄面板，md 与 lg 用于 MV 页侧栏。 */
  size?: "sm" | "md" | "lg";
}

/** The search grids are NetEase's, so their cards take its summaries. */
export interface MvCardProps {
  mv: MvSummary;
}

export interface MvSimilarContentProps {
  detail: MusicMvDetail;
  isTheater: boolean;
  onNextChange: (id: string | null) => void;
}

export interface MvSimilarSkeletonProps {
  isTheater?: boolean;
}

export interface MvPlayerProps {
  isTheater: boolean;
  isPlayerBarHidden: boolean;
  onTogglePlayerBar: () => void;
  onToggleTheater: () => void;
  /** 详情里已知的画质高度（像素）；平台只在播放时给出画质时为空。 */
  resolutions: readonly number[];
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

export interface MvSettingsMenuProps {
  resolutions: number[];
  current: number;
  quality: number | null;
  playbackRate: number;
  autoNext: boolean;
  onQualityChange: (resolution: number | null) => void;
  onPlaybackRateChange: (rate: number) => void;
  onAutoNextChange: (value: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface MvInfoProps {
  detail: MusicMvDetail;
}

export interface SongMvBadgeProps {
  /** 歌曲关联的 MV id；缺省或 0 时不渲染。 */
  mvId?: number | string;
  onNavigate?: () => void;
}

export interface MvArtistAvatarProps {
  artistId?: number | string;
  name: string;
  className?: string;
}

export interface MvChannelProps {
  artist: { id: number | string; name: string };
}

export interface MvCommentsProps {
  mvid: string;
}

export interface MvCardPreviewProps {
  mv: MusicResourceRef<"mv">;
}
