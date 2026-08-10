import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import type { SongDetail } from "@/types/api/music";
import type { ProgressRangeMarker } from "@/types/components/slider";

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
  virtualStart: number;
  virtualSize: number;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
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
  title?: string;
}
