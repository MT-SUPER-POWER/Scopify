import type { ReactNode } from "react";
import type { MvDetail, MvResolution, MvSummary } from "@/types/api/mv";

export interface MvListItemProps {
  mv: MvSummary;
  /** 传入时渲染为链接；否则为按钮并调用 onSelect。 */
  href?: string;
  onSelect?: (mvId: number) => void;
  isActive?: boolean;
  /** 艺人前的小标签，例如「本曲 MV」。 */
  badge?: ReactNode;
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
