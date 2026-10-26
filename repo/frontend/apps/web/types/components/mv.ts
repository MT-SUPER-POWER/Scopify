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
