import type { AdjustablePlaybackClock, PlaybackClock } from "@/types/playbackProjection";

function readEpochNowMs(): number {
  const performance = globalThis.performance;
  if (performance && Number.isFinite(performance.timeOrigin)) {
    return performance.timeOrigin + performance.now();
  }

  return Date.now();
}

export const systemPlaybackClock: PlaybackClock = {
  nowMs: readEpochNowMs,
};

export class ManualPlaybackClock implements AdjustablePlaybackClock {
  constructor(private currentNowMs = 0) {
    this.assertValidTime(currentNowMs);
  }

  advanceBy(durationMs: number): number {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new RangeError("Playback clock can only advance by a finite non-negative duration");
    }

    this.currentNowMs += durationMs;
    return this.currentNowMs;
  }

  nowMs(): number {
    return this.currentNowMs;
  }

  setNowMs(nowMs: number): void {
    this.assertValidTime(nowMs);
    if (nowMs < this.currentNowMs) {
      throw new RangeError("Playback clock cannot move backward");
    }

    this.currentNowMs = nowMs;
  }

  private assertValidTime(nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0) {
      throw new RangeError("Playback clock time must be finite and non-negative");
    }
  }
}
