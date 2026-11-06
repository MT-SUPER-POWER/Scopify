import { createFrameStats } from "@/lib/lyrics/frameStats";
import type { RhineLoadTimings } from "@/types/lyrics/rhine/background";

// lib/lyrics/rhine/loadDiagnostics.ts
// Where one Rhine background load spends its time. Logged once per load so a slow start can be read from the
// runtime log instead of guessed at: each stage's wall time, and the main-thread long tasks (over 50 ms) that
// landed inside the load window, which are what make the interface stutter while the background builds.
// The Long Tasks API alone proved unreliable for this: a measured 2.4 s synchronous draw did not show up as a long
// task at all. So the window also runs a requestAnimationFrame probe, whose gaps are the stutter a user sees.

/** How long long tasks keep being collected after the scene is ready, so the first frames are included. */
const LONG_TASK_OBSERVE_MS = 1500;
/** Gaps between animation frames longer than this (about six frames at 60 Hz) are reported. */
const FRAME_GAP_REPORT_MS = 100;

interface LongTask {
  /** Start relative to the load start. */
  startMs: number;
  durationMs: number;
}

export interface RhineLoadStages {
  timings: RhineLoadTimings;
  /** Renderer construction and `initialize()`: context, environment map, composer passes. */
  rendererMs: number;
  /** Scene construction (the cell grid and first field); the warm-up is separate. */
  sceneMs: number;
  warmUpMs: number;
  /** Part of the warm-up spent compiling shader programs in the background. */
  precompileMs: number;
  warmUpPaintMs: readonly number[];
  /** The adapter the context runs on, as the driver names it. */
  adapter: string;
  /** Whole load, from the start of the model request to the scene being ready. */
  totalMs: number;
}

/** How often a running background logs how it keeps up. */
const FRAME_REPORT_MS = 30_000;

/**
 * Animation frame intervals while the background runs. The load window above ends 1.5 s after the scene is ready,
 * which says nothing about the running frame rate. Short intervals with no long tasks are a healthy loop; long
 * intervals with no long tasks mean the main thread is idle and the GPU is the one falling behind.
 */
export function createRhineFrameStats() {
  return createFrameStats("RhineBackground", { reportMs: FRAME_REPORT_MS });
}

/** Starts collecting long tasks; `finish` stops after a short settle period and logs the whole picture. */
export function startRhineLoadDiagnostics() {
  const origin = performance.now();
  const tasks: LongTask[] = [];
  let observer: PerformanceObserver | undefined;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        tasks.push({ startMs: entry.startTime - origin, durationMs: entry.duration });
      }
    });
    observer.observe({ type: "longtask" });
  } catch {
    // The Long Tasks API is missing in some embedders; the stage timings still work.
    observer = undefined;
  }
  // Frame gaps: the time between two animation frames. A frame loop that waits for the main thread shows
  // every freeze as one long gap, whatever the Long Tasks API does or does not report.
  const frameGaps: LongTask[] = [];
  let frameHandle = 0;
  let lastFrame = performance.now();
  const probeFrame = (now: number) => {
    if (now - lastFrame > FRAME_GAP_REPORT_MS) {
      frameGaps.push({ startMs: lastFrame - origin, durationMs: now - lastFrame });
    }
    lastFrame = now;
    frameHandle = requestAnimationFrame(probeFrame);
  };
  frameHandle = requestAnimationFrame(probeFrame);
  let timer: number | undefined;
  return {
    /** Ends the observation without logging (load aborted or failed). */
    cancel() {
      window.clearTimeout(timer);
      cancelAnimationFrame(frameHandle);
      observer?.disconnect();
    },
    /** Logs the stage timings now and the long tasks once the first frames have had time to run. */
    finish(stages: Omit<RhineLoadStages, "totalMs">) {
      const totalMs = performance.now() - origin;
      const round = (value = 0) => Math.round(value);
      console.info(
        `[RhineBackground] ready in ${round(totalMs)} ms: model fetch ${round(stages.timings.fetchMs)}, ` +
          `parse ${round(stages.timings.parseMs)}, model ${round(stages.timings.modelMs)}, ` +
          `renderer ${round(stages.rendererMs)}, scene ${round(stages.sceneMs)} ` +
          `(warm-up ${round(stages.warmUpMs)}: precompile ${round(stages.precompileMs)}, paints ${stages.warmUpPaintMs.map(round).join("/")}) on ${stages.adapter}`,
      );
      timer = window.setTimeout(() => {
        observer?.takeRecords().forEach((entry) => {
          tasks.push({ startMs: entry.startTime - origin, durationMs: entry.duration });
        });
        observer?.disconnect();
        cancelAnimationFrame(frameHandle);
        const longestGap = frameGaps.reduce((max, gap) => Math.max(max, gap.durationMs), 0);
        console.info(
          `[RhineBackground] ${frameGaps.length} animation frame gap(s) over ${FRAME_GAP_REPORT_MS} ms, ` +
            `longest ${round(longestGap)} ms`,
          frameGaps.map((gap) => `${round(gap.startMs)}+${round(gap.durationMs)}`).join(" "),
        );
        const longest = tasks.reduce((max, task) => Math.max(max, task.durationMs), 0);
        console.info(
          `[RhineBackground] ${tasks.length} long task(s) in the first ${Math.round(totalMs + LONG_TASK_OBSERVE_MS)} ms, ` +
            `longest ${round(longest)} ms`,
          tasks.map((task) => `${round(task.startMs)}+${round(task.durationMs)}`).join(" "),
        );
      }, LONG_TASK_OBSERVE_MS);
    },
  };
}
