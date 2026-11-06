// lib/lyrics/frameStats.ts
// Sustained frame intervals for a lyric renderer. A load time says nothing about whether it stays smooth, so a
// renderer samples every frame and logs the spread. The log lines reach the installed app's log files.

export interface FrameStatsReport {
  frames: number;
  seconds: number;
  average: number;
  p95: number;
  longest: number;
}

export function createFrameStats(
  label: string,
  { reportMs, onReport }: { reportMs: number; onReport?: (report: FrameStatsReport) => void },
) {
  let intervals: number[] = [];
  let last = 0;
  let windowStart = 0;
  return {
    sample(now: number) {
      if (last > 0) intervals.push(now - last);
      else if (windowStart === 0) windowStart = now;
      last = now;
      if (now - windowStart < reportMs || intervals.length === 0) return;
      const sorted = [...intervals].sort((a, b) => a - b);
      const report: FrameStatsReport = {
        frames: sorted.length,
        seconds: (now - windowStart) / 1000,
        average: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        longest: sorted.at(-1) ?? 0,
      };
      console.info(
        `[${label}] ${report.frames} frames in the last ${Math.round(report.seconds)} s: ` +
          `average ${report.average.toFixed(1)} ms, p95 ${report.p95.toFixed(1)} ms, ` +
          `longest ${report.longest.toFixed(1)} ms`,
      );
      onReport?.(report);
      intervals = [];
      windowStart = now;
    },
    /** The loop stopped (hidden, paused): the time until it restarts is not a frame interval. */
    pause() {
      last = 0;
    },
  };
}
