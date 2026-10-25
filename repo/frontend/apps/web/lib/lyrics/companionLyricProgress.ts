import {
  buildLineGraphemeTimeline,
  type GraphemeTiming,
} from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import type { Line } from "@/components/lyrics/folia/src/types";

// Lines are immutable per lyric payload. Keep parser-derived timing for the line's lifetime.
const timelines = new WeakMap<Line, GraphemeTiming[]>();

export function computeCompanionLyricProgress(line: Line, timeSeconds: number): number[] {
  let timeline = timelines.get(line);
  if (!timeline) {
    timeline = buildLineGraphemeTimeline(line);
    timelines.set(line, timeline);
  }
  return timeline.map(({ startTime, endTime }) => {
    if (timeSeconds < startTime) return 0;
    if (timeSeconds >= endTime) return 1;
    const duration = endTime - startTime;
    return duration > 0 ? Math.max(0, Math.min(1, (timeSeconds - startTime) / duration)) : 1;
  });
}
