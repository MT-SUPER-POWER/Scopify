import { motionValue } from "framer-motion";
import { DEFAULT_SONNET_TUNING } from "@/components/lyrics/folia/src/types";
import {
  FOLIA_SETTINGS_PREVIEW_LINES,
  FOLIA_SETTINGS_PREVIEW_CONTENT,
} from "@/constants/lyricsPreview";
import type {
  FoliaRenderPerformanceOptions,
  FoliaRenderPerformanceReport,
} from "@/types/lyrics/folia/renderPerformance";
import {
  buildFoliaRenderPerformancePlan,
  recommendFoliaRenderQuality,
  summarizeFoliaFrameIntervals,
} from "./renderPerformancePlan";

const REFRESH_SAMPLE_MS = 850;
const WARMUP_MS = 700;
const RENDER_SAMPLE_MS = 4_500;

async function collectFrameIntervals(
  durationMs: number,
  signal: AbortSignal,
  draw?: (elapsedMs: number) => void,
): Promise<number[]> {
  signal.throwIfAborted();
  if (document.hidden) throw new Error("Renderer measurement requires a visible window");

  return new Promise((resolve, reject) => {
    const intervals: number[] = [];
    let start: number | undefined;
    let previous: number | undefined;
    let frame = 0;
    const deadline = window.setTimeout(
      () => finish(new Error("Renderer measurement timed out")),
      durationMs + 4_000,
    );
    const onAbort = () => finish(signal.reason);
    const onVisibility = () => {
      if (document.hidden) finish(new Error("Window was hidden during renderer measurement"));
    };
    function finish(error?: unknown) {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(deadline);
      signal.removeEventListener("abort", onAbort);
      document.removeEventListener("visibilitychange", onVisibility);
      if (error !== undefined) reject(error);
      else if (intervals.length < 2) reject(new Error("Too few frames to measure"));
      else resolve(intervals);
    }
    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      if (previous !== undefined && now > previous) intervals.push(now - previous);
      previous = now;
      try {
        draw?.(elapsed);
      } catch (error) {
        finish(error);
        return;
      }
      if (elapsed >= durationMs) finish();
      else frame = window.requestAnimationFrame(tick);
    };

    signal.addEventListener("abort", onAbort, { once: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame = window.requestAnimationFrame(tick);
  });
}

export async function runFoliaRenderPerformanceCheck({
  host,
  current,
  theme,
  signal,
  onProgress,
}: FoliaRenderPerformanceOptions): Promise<FoliaRenderPerformanceReport> {
  const refreshIntervals = await collectFrameIntervals(REFRESH_SAMPLE_MS, signal);
  refreshIntervals.sort((a, b) => a - b);
  // The fastest typical intervals approximate the display cadence without trusting one outlier.
  const refreshMs = refreshIntervals[Math.floor(refreshIntervals.length / 5)];

  const [{ SonnetPixiRuntime }, { compileSonnetProgram }] = await Promise.all([
    import("@/components/lyrics/folia/src/components/visualizer/sonnet/createSonnetPixiRuntime"),
    import("@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetProgram"),
  ]);
  const { seed } = FOLIA_SETTINGS_PREVIEW_CONTENT;
  const program = compileSonnetProgram(FOLIA_SETTINGS_PREVIEW_LINES, seed);
  const plan = buildFoliaRenderPerformancePlan(current);
  const results: FoliaRenderPerformanceReport["results"] = [];
  const width = host.clientWidth;
  const height = host.clientHeight;

  for (const [index, quality] of plan.entries()) {
    signal.throwIfAborted();
    onProgress(index + 1, plan.length);
    const currentTime = motionValue(0);
    const runtime = await SonnetPixiRuntime.create({
      host,
      songSeed: seed,
      program,
      theme,
      tuning: DEFAULT_SONNET_TUNING,
      currentTime,
      renderScale: quality.scale,
      antialiasMode: quality.antialias,
      lyricsFontScale: 1,
      staticMode: false,
      transparentBackground: false,
      // The benchmark drives the same render path for every step at the display's own cadence.
      paused: true,
      signal,
    });
    const canvas = host.querySelector("canvas");
    let contextLost = false;
    const onContextLost = () => {
      contextLost = true;
    };
    try {
      if (!canvas) throw new Error("Sonnet renderer did not provide a canvas");
      canvas.addEventListener("webglcontextlost", onContextLost);
      const draw = (elapsedMs: number) => {
        if (contextLost) throw new Error("Sonnet renderer lost its WebGL context");
        if (host.clientWidth !== width || host.clientHeight !== height) {
          throw new Error("Sonnet viewport changed during measurement");
        }
        currentTime.set(elapsedMs / 1_000);
        runtime.renderOnce();
      };
      await collectFrameIntervals(WARMUP_MS, signal, draw);
      const intervals = await collectFrameIntervals(RENDER_SAMPLE_MS, signal, draw);
      results.push(summarizeFoliaFrameIntervals(quality, intervals, refreshMs));
    } finally {
      canvas?.removeEventListener("webglcontextlost", onContextLost);
      runtime.destroy();
    }
  }

  return { results, recommended: recommendFoliaRenderQuality(results, refreshMs) };
}
