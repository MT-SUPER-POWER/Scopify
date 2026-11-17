import type { LyricRenderQuality } from "@/components/lyrics/folia/src/types";
import type { FoliaRenderPerformanceResult } from "@/types/lyrics/folia/renderPerformance";

/** Each step makes the smallest remaining reduction. Always measure the saved global setting first. */
export function buildFoliaRenderPerformancePlan(current: LyricRenderQuality): LyricRenderQuality[] {
  const plan = [current];
  if (current.antialias !== "off") plan.push({ ...current, antialias: "off" });
  if (current.scale > 0.75) plan.push({ scale: 0.75, antialias: "off" });
  if (current.scale > 0.5) plan.push({ scale: 0.5, antialias: "off" });
  return plan;
}

export function summarizeFoliaFrameIntervals(
  quality: LyricRenderQuality,
  intervals: readonly number[],
  refreshMs: number,
): FoliaRenderPerformanceResult {
  const totalMs = intervals.reduce((total, interval) => total + interval, 0);
  const slowFrames = [...intervals]
    .sort((a, b) => b - a)
    .slice(0, Math.ceil(intervals.length * 0.01));
  const slowMs = slowFrames.reduce((total, interval) => total + interval, 0);
  return {
    quality,
    fps: (intervals.length * 1_000) / totalMs,
    lowFps: (slowFrames.length * 1_000) / slowMs,
    lateShare: intervals.filter((interval) => interval > refreshMs * 1.5).length / intervals.length,
  };
}

/** Prefer the least reduced smooth setting. Compare late frames when the averages are close. */
export function recommendFoliaRenderQuality(
  results: readonly FoliaRenderPerformanceResult[],
  refreshMs: number,
): FoliaRenderPerformanceResult {
  const targetFps = 1_000 / refreshMs;
  const smooth = results.find(
    (result) => result.fps >= targetFps * 0.9 && result.lateShare <= 0.05,
  );
  if (smooth) return smooth;

  return results.reduce((best, candidate) => {
    const nearTie = Math.abs(candidate.fps - best.fps) <= targetFps * 0.02;
    return (nearTie ? candidate.lateShare < best.lateShare : candidate.fps > best.fps)
      ? candidate
      : best;
  });
}
