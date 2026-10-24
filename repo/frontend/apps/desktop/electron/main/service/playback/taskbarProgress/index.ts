import type { PlaybackClockAnchor, PlaybackProjection } from "@scopify/desktop-contract";

import type {
  TaskbarProgressService,
  TaskbarProgressServiceOptions,
  TaskbarProgressState,
} from "@/types/service/playback/taskbarProgress";

/** The taskbar bar is only a few pixels wide; once per second is smooth enough. */
const TICK_INTERVAL_MS = 1000;

const CLEARED: TaskbarProgressState = { mode: "normal", progress: -1 };

/** 把播放快照映射为任务栏进度：播放中正常、暂停显示暂停样式，其余状态清除。 */
export function resolveTaskbarProgress(
  snapshot: PlaybackProjection | null,
  anchor: PlaybackClockAnchor | null,
  nowMs: number,
): TaskbarProgressState {
  if (!snapshot?.track || !(snapshot.durationMs > 0)) return CLEARED;
  const { phase } = snapshot;
  if (phase === "idle" || phase === "ended" || phase === "error") return CLEARED;

  let positionMs = anchor?.positionMs ?? snapshot.positionMs;
  if (anchor && snapshot.isPlaying) {
    positionMs += Math.max(0, nowMs - anchor.sampledAtMs) * (anchor.rate || 1);
  }
  const progress = Math.min(1, Math.max(0, positionMs / snapshot.durationMs));
  return { mode: phase === "paused" ? "paused" : "normal", progress };
}

/**
 * Mirrors the current song's position onto the Windows taskbar icon.
 * macOS and Linux have no equivalent music affordance, so it stays a no-op there.
 */
export function initializeTaskbarProgressService(
  options: TaskbarProgressServiceOptions,
): TaskbarProgressService {
  if (process.platform !== "win32") return { dispose() {} };

  let ticker: ReturnType<typeof setInterval> | undefined;
  let applied: TaskbarProgressState | null = null;

  function apply(next: TaskbarProgressState) {
    if (options.window.isDestroyed()) return;
    // Round to 0.1% so idle ticks do not repaint an unchanged bar.
    const progress = next.progress < 0 ? -1 : Math.round(next.progress * 1000) / 1000;
    if (applied?.progress === progress && applied.mode === next.mode) return;
    applied = { mode: next.mode, progress };
    if (progress < 0) options.window.setProgressBar(-1);
    else options.window.setProgressBar(progress, { mode: next.mode });
  }

  function update() {
    const snapshot = options.playback.getSnapshot();
    apply(resolveTaskbarProgress(snapshot, options.getPlaybackAnchor(), Date.now()));

    const shouldTick = !!snapshot?.isPlaying;
    if (shouldTick && !ticker) ticker = setInterval(update, TICK_INTERVAL_MS);
    else if (!shouldTick && ticker) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }

  const unsubscribe = options.playback.subscribe(update);
  update();

  return {
    dispose() {
      unsubscribe();
      clearInterval(ticker);
      ticker = undefined;
      apply(CLEARED);
    },
  };
}
