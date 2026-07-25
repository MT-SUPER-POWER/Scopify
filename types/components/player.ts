import type { CSSProperties } from "react";
import type { SongDetail } from "@/types/api/music";

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
