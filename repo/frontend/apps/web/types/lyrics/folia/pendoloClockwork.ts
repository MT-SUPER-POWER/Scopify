import type React from "react";
import type { LyricRenderScale } from "@/components/lyrics/folia/src/types";
import type { MotionValue } from "framer-motion";
import type { PendoloMotionProfile } from "@/components/lyrics/folia/src/components/visualizer/pendolo/pendoloMotionProfile";

// src/components/visualizer/pendolo/PendoloClockworkCanvas.tsx

export interface PendoloClockworkCanvasProps {
  centerX: number;
  centerY: number;
  viewportWidth: number;
  viewportHeight: number;
  baseRadius: number;
  lyricRingRadius: number;
  escapementAngleMotionValue: MotionValue<number>;
  audioBassMotionValue?: MotionValue<number>;
  audioBass?: number;
  primaryTextColor: string;
  accentTextColor: string;
  backgroundColor?: string;
  showGearDecor: "none" | "subtle" | "full";
  showCenterGradient?: boolean;
  showCover?: boolean;
  coverUrl?: string | null;
  enableLineGlow?: boolean;
  paused?: boolean;
  motionProfile: PendoloMotionProfile;
  renderScale?: LyricRenderScale;
  antialias?: boolean;
  mirrored?: boolean;
  projection?: PendoloDialProjection;
  parallaxScalePx?: number;
  depthStencil?: boolean;
  onBackendChange?: (webgl: boolean) => void;
}

export interface PendoloDialProjection {
  /** 行主序 3x3：[x', y', w] = M · [x, y, 1]，屏幕上的点（相对轮心）= (x'/w, y'/w)。 */
  matrix: Float32Array;
  /** 倾斜是不是 0（镜像不算）；是的话透视除法恒为 1，可以按原来的仿射路径画。 */
  flat: boolean;
  /**
   * 分层视差：离表盘平面高 1px（朝观看者）的点，在齐次坐标里多出来的那一份，[x', y', w]。
   * 就是倾斜后表盘法线朝观看者的方向（w 那一项已除过视距）。平放时是 (0, 0, -1/f)。
   */
  lift: [number, number, number];
  /** 1 / 视距，抬高 h 的一层先在平面内按 1 - h/f 缩一下，平放时正好抵掉透视放大。 */
  invFocal: number;
}

export interface PendoloStandUp {
  rotationDeg: MotionValue<number>;
  tiltDeg: number;
}

export interface PendoloRotatingLineProps {
  wheelRotationDeg: MotionValue<number>;
  mirrored: boolean;
  railWidth: number;
  baseAngleDeg: number;
  baseOpacity: number;
  left: number;
  top: number;
  standUp?: PendoloStandUp;
  fontFamily: string;
  fontWeight: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children: React.ReactNode;
}
