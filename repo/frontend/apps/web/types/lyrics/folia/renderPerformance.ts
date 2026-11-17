import type { LyricRenderQuality, Theme } from "@/components/lyrics/folia/src/types";

export interface FoliaRenderPerformanceResult {
  quality: LyricRenderQuality;
  fps: number;
  lowFps: number;
  lateShare: number;
}

export interface FoliaRenderPerformanceReport {
  results: FoliaRenderPerformanceResult[];
  recommended: FoliaRenderPerformanceResult;
}

export interface FoliaRenderPerformanceOptions {
  host: HTMLDivElement;
  current: LyricRenderQuality;
  theme: Theme;
  signal: AbortSignal;
  onProgress: (step: number, total: number) => void;
}

export interface FoliaRenderPerformanceDialogProps {
  onClose: () => void;
  theme: Theme;
}

export type FoliaRenderPerformanceState =
  | { status: "idle" }
  | { status: "running"; step?: number; total?: number }
  | { status: "failed" }
  | { status: "complete"; report: FoliaRenderPerformanceReport };
