import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import type { SongDetail } from "@/types/song/api";
import type { ProgressRangeMarker } from "@/types/components/slider";
import type { SongStatsEnrichmentStatus } from "@/types/song/stats";
import type { ShortcutCommandId } from "@/types/shortcuts";

export interface PlaybackProgressBarProps {
  ariaLabel?: string;
  bufferedPositionMs?: number;
  durationMs: number;
  onSeek(positionMs: number, isCommit: boolean): void;
  positionMs: number;
  rangeMarkers?: readonly ProgressRangeMarker[];
  variant?: "folia" | "player";
}

export interface QueueItemProps {
  song: SongDetail;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
}

export interface SortablePlayerQueueItemProps extends QueueItemProps {
  id: string;
  virtualStart: number;
  virtualSize: number;
}

export interface PlayerQueueListHandle {
  scrollToCurrent(): void;
}

export interface PlayerQueueListProps {
  isOpen: boolean;
  /** 覆盖列表滚动区尺寸；默认是浮层中的固定高度。 */
  className?: string;
}

export interface PlayerQueueItemCoverProps {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  song: SongDetail;
}

export interface LyricQueueRowProps {
  song: SongDetail;
  index: number;
  isCurrent: boolean;
  onPlay: (index: number) => void;
  style?: CSSProperties;
}

export interface PlayerBarStatActionProps {
  children: ReactNode;
  count?: number;
  countClassName?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  onRetry?: () => void;
  retryLabel?: string;
  shortcutCommandId?: ShortcutCommandId;
  statsStatus?: SongStatsEnrichmentStatus;
  title?: string;
}
