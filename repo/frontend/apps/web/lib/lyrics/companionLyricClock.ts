import type { Line } from "@/components/lyrics/folia/src/types";
import type { PlaybackProjectionExternalStore } from "@/types/playback/transport";
import { applyLyricOffsetMs, findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";

/** Non-negative cursors are active lines; -1 is the intro; -(index + 2) is a gap after index. */
export function getCompanionLyricCursor(lines: Line[], timeSeconds: number): number {
  const index = findLatestActiveFoliaLineIndex(lines, timeSeconds);
  if (index >= 0) return index;
  for (let previous = lines.length - 1; previous >= 0; previous -= 1) {
    if (timeSeconds >= lines[previous].startTime) return -(previous + 2);
  }
  return -1;
}

/** The clock is sampled each frame, but React is notified only when the lyric/gap changes. */
export function createCompanionLyricClock(
  store: PlaybackProjectionExternalStore,
  lines: Line[],
  offsetMs: number,
) {
  const read = () =>
    getCompanionLyricCursor(lines, applyLyricOffsetMs(store.samplePositionMs(), offsetMs) / 1_000);
  let cursor = read();
  let frame: number | null = null;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const refresh = () => {
    const next = read();
    if (next !== cursor) {
      cursor = next;
      for (const listener of [...listeners]) listener();
    }
    // A synchronous React update may have unsubscribed the last consumer above.
    if (listeners.size === 0) return;
    const projection = store.getSnapshot();
    const running =
      lines.length > 0 && projection.isPlaying && projection.connection === "connected";
    if (running && frame === null) frame = requestAnimationFrame(tick);
    if (!running && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };
  function tick() {
    frame = null;
    refresh();
  }

  return {
    getSnapshot: () => cursor,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        unsubscribe = store.subscribe(refresh);
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        unsubscribe?.();
        unsubscribe = null;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
      };
    },
  };
}
