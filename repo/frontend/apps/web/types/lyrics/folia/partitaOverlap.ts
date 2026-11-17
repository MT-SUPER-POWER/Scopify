import type React from "react";
import type { GlowWordPose } from "./glowWord";

export interface PartitaOverlapRow {
  widthsEm: number[];
  wordConfigs: Array<GlowWordPose & { x: number; y: number }>;
  config: { rotate: number; marginBottom: string };
  rtl: boolean;
}

export interface PartitaRowSpacing {
  words: React.CSSProperties[];
  marginTop?: string;
  marginBottom: string;
}
