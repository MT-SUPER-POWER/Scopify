import type { MotionValue } from "framer-motion";
import type { RefObject } from "react";

import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";

export type RadioBrowseRange = {
  min: number;
  max: number;
};

export type RadioWallSlot = {
  /** Position on the rail. In repeat-all it may be outside the original queue. */
  position: number;
  trackIndex: number | null;
};

export type RadioWallMetrics = {
  width: number;
  height: number;
  cardSize: number;
  centerX: number;
  centerY: number;
  radius: number;
  step: number;
};

export interface RadioWallRailOptions {
  anchor: number;
  anchorKey: string;
  range: RadioBrowseRange;
  fieldRef: RefObject<HTMLDivElement | null>;
  step: number;
  reducedMotion: boolean | null;
}

export interface RadioWallDrag {
  pointerId: number;
  x: number;
  y: number;
  from: number;
  moved: boolean;
  horizontal: boolean;
}

export interface RadioRedactionWidths {
  artist: number;
  title: number;
}

export interface RadioWallCardProps {
  slot: RadioWallSlot;
  metrics: RadioWallMetrics;
  rail: MotionValue<number>;
  track: PlaylistLatticeProps["tracks"][number] | null;
  centered: boolean;
  current: boolean;
  faceDown: boolean;
  reducedMotion: boolean;
  showLyrics: boolean;
}
