import type {
  SonnetParagraphKind,
  SonnetSemanticSegment,
  SonnetShotKind,
} from "../../../components/lyrics/folia/src/components/visualizer/sonnet/types";
import type { SonnetSegmentRole } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetTypographyRoles";

// src/components/visualizer/sonnet/sonnetTypographyLayout.ts
// PV-style kinetic typography layouts based on exact box measurements
export interface SonnetTypographyPlacement {
  segmentIndex: number;
  displayText: string;
  role: SonnetSegmentRole;
  fontScale: number;
  measuredWidth: number;
  measuredHeight: number;
  x: number;
  y: number;
  rotation: number;
  enterX: number;
  enterY: number;
  vertical: boolean;
  layoutDirection: "horizontal" | "vertical";
  timingPhase: number;
}

export interface SonnetTypographyLayoutOptions {
  lines: SonnetSemanticSegment[][];
  shotKind: SonnetShotKind;
  paragraphKind: SonnetParagraphKind;
  width: number;
  height: number;
  baseFontSize: number;
  fontFamily: string;
  fontWeight?: number | null;
}
