import type {
  PlaybackHostReconnectScheduler,
  PlaybackHostReconnectSchedulerOptions,
} from "@/types/playbackHost";

/**
 * Serialises recovery attempts for a control port. A snapshot is the only
 * convergence proof: it cancels queued work and resets a later recovery to
 * the shortest delay. The retry interval is capped at the final configured
 * value, so a Host that needs longer than its startup backoff is still seeded
 * without creating a high-rate command loop.
 */
export function createPlaybackHostReconnectScheduler(
  options: PlaybackHostReconnectSchedulerOptions,
): PlaybackHostReconnectScheduler {
  const delaysMs = validateDelays(options.delaysMs);
  let attempt = 0;
  let closed = false;
  let isAwaitingSnapshot = false;
  let isConnecting = false;
  let timer: unknown | null = null;

  const runReconnect = () => {
    if (closed || isConnecting) return;
    isConnecting = true;
    try {
      options.onReconnect();
    } finally {
      isConnecting = false;
    }
  };

  const scheduleNext = () => {
    if (closed || !isAwaitingSnapshot || timer !== null) return;

    const delayMs = delaysMs[attempt];
    attempt = Math.min(attempt + 1, delaysMs.length - 1);
    timer = options.setTimer(() => {
      timer = null;
      if (closed || !isAwaitingSnapshot) return;
      runReconnect();
      scheduleNext();
    }, delayMs);
  };

  const clearTimer = () => {
    if (timer === null) return;
    options.clearTimer(timer);
    timer = null;
  };

  return {
    close() {
      if (closed) return;
      closed = true;
      clearTimer();
    },
    notifyConnectionClosed() {
      if (closed) return;
      // A recoverable broker receipt and a subsequent passive close often
      // describe the same Host outage. Preserve the existing cadence instead
      // of repeatedly resetting it to 250ms.
      if (isAwaitingSnapshot) return;
      attempt = 0;
      isAwaitingSnapshot = true;
      scheduleNext();
    },
    notifySnapshot() {
      if (closed) return;
      clearTimer();
      attempt = 0;
      isAwaitingSnapshot = false;
    },
    start() {
      if (closed || isAwaitingSnapshot) return;
      isAwaitingSnapshot = true;
      runReconnect();
      scheduleNext();
    },
  };
}

function validateDelays(delaysMs: readonly number[]): readonly number[] {
  if (delaysMs.length === 0)
    throw new RangeError("Playback Host reconnect delays cannot be empty.");
  if (delaysMs.some((delayMs) => !Number.isFinite(delayMs) || delayMs <= 0)) {
    throw new RangeError("Playback Host reconnect delays must be finite positive numbers.");
  }
  return [...delaysMs];
}
