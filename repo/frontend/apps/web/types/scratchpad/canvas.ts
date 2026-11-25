import type { LucideIcon } from "lucide-react";
import type { MotionValue } from "framer-motion";
import type { PlayerTrack } from "@/types/player/model";

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CanvasSpacing {
  x: number;
  y: number;
  edge?: number;
  card: {
    width: number;
    height: number;
  };
}

export type CanvasCardVariant = "note" | "queue" | "history" | "moment";

export interface CanvasEntry {
  key: string;
  track: PlayerTrack;
  meta?: string;
  badge?: string;
  tagLine?: string;
  quote?: string;
  counts?: string;
  isCurrent?: boolean;
  isDimmed?: boolean;
  position?: number;
}

export interface CanvasAction {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
  disabled?: boolean;
  destructive?: boolean;
  title?: string;
}

export interface CanvasGroup<E extends CanvasEntry = CanvasEntry> {
  key: string;
  label: string;
  sublabel?: string;
  jumpLabel?: string;
  entries: E[];
  buttons?: readonly CanvasAction[];
}

export interface CanvasSideTip {
  key: string;
  label: string;
}

export interface CanvasSideConfig {
  jumpLabel: string;
  tipsLabel: string;
  tips: readonly CanvasSideTip[];
  chunk?: number;
  locateLabel?: string;
}

export interface CanvasJumpTarget {
  id: string;
  groupKey: string;
  index: number;
  label: string;
  count: number;
  holdsFocus: boolean;
  top: number;
  bottom: number;
}

export interface CardMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
}
