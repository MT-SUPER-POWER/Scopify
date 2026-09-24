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
}
