import type { RhineLoadTimings } from "@/types/lyrics/rhine/background";

// lib/lyrics/rhine/loadDiagnostics.ts
// Where one Rhine background load spends its time. Logged once per load so a slow start can be read from the
// runtime log instead of guessed at: each stage's wall time, and the main-thread long tasks (over 50 ms) that
// landed inside the load window, which are what make the interface stutter while the background builds.

/** How long long tasks keep being collected after the scene is ready, so the first frames are included. */
const LONG_TASK_OBSERVE_MS = 1500;

interface LongTask {
  /** Start relative to the load start. */
  startMs: number;
  durationMs: number;
}

export interface RhineLoadStages {
  timings: RhineLoadTimings;
  /** Renderer construction and `initialize()`: context, environment map, composer passes. */
  rendererMs: number;
  /** Scene construction including the warm-up draw. */
  sceneMs: number;
  warmUpMs: number;
  warmUpPaintMs: readonly number[];
  /** Whole load, from the start of the model request to the scene being ready. */
  totalMs: number;
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
  let timer: number | undefined;
  return {
    /** Ends the observation without logging (load aborted or failed). */
    cancel() {
      window.clearTimeout(timer);
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
          `(warm-up ${round(stages.warmUpMs)}, paints ${stages.warmUpPaintMs.map(round).join("/")})`,
      );
      timer = window.setTimeout(() => {
        observer?.takeRecords().forEach((entry) => {
          tasks.push({ startMs: entry.startTime - origin, durationMs: entry.duration });
        });
        observer?.disconnect();
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
