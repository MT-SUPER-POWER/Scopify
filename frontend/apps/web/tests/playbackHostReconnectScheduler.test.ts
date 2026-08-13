import { describe, expect, test } from "bun:test";

import { createPlaybackHostReconnectScheduler } from "@/lib/playbackHost/reconnectScheduler";

interface PendingTimer {
  callback: () => void;
  delayMs: number;
}

function createTimerHarness() {
  let nextHandle = 0;
  const timers = new Map<number, PendingTimer>();

  return {
    clearTimer(handle: unknown) {
      timers.delete(handle as number);
    },
    fireNext() {
      const [handle, timer] = timers.entries().next().value ?? [];
      if (handle === undefined || !timer) throw new Error("No pending timer.");
      timers.delete(handle);
      timer.callback();
    },
    pendingDelays() {
      return [...timers.values()].map((timer) => timer.delayMs);
    },
    setTimer(callback: () => void, delayMs: number) {
      nextHandle += 1;
      timers.set(nextHandle, { callback, delayMs });
      return nextHandle;
    },
  };
}

describe("PlaybackHostReconnectScheduler", () => {
  test("uses one serial capped recovery cadence until a snapshot converges", () => {
    const timer = createTimerHarness();
    let reconnects = 0;
    const scheduler = createPlaybackHostReconnectScheduler({
      clearTimer: timer.clearTimer,
      delaysMs: [250, 500, 1_000, 2_000, 5_000],
      onReconnect: () => {
        reconnects += 1;
      },
      setTimer: timer.setTimer,
    });

    scheduler.start();
    expect(reconnects).toBe(1);
    expect(timer.pendingDelays()).toEqual([250]);

    timer.fireNext();
    expect(reconnects).toBe(2);
    expect(timer.pendingDelays()).toEqual([500]);

    timer.fireNext();
    expect(reconnects).toBe(3);
    expect(timer.pendingDelays()).toEqual([1_000]);

    timer.fireNext();
    expect(reconnects).toBe(4);
    expect(timer.pendingDelays()).toEqual([2_000]);

    timer.fireNext();
    expect(reconnects).toBe(5);
    expect(timer.pendingDelays()).toEqual([5_000]);

    timer.fireNext();
    expect(reconnects).toBe(6);
    expect(timer.pendingDelays()).toEqual([5_000]);

    scheduler.notifySnapshot();
    expect(timer.pendingDelays()).toEqual([]);
  });

  test("resets to 250ms after every passive port close without duplicate timers", () => {
    const timer = createTimerHarness();
    let reconnects = 0;
    const scheduler = createPlaybackHostReconnectScheduler({
      clearTimer: timer.clearTimer,
      delaysMs: [250, 500, 1_000],
      onReconnect: () => {
        reconnects += 1;
      },
      setTimer: timer.setTimer,
    });

    scheduler.start();
    scheduler.notifySnapshot();
    scheduler.notifyConnectionClosed();
    scheduler.notifyConnectionClosed();
    expect(timer.pendingDelays()).toEqual([250]);

    timer.fireNext();
    expect(reconnects).toBe(2);
    expect(timer.pendingDelays()).toEqual([500]);

    scheduler.close();
    expect(timer.pendingDelays()).toEqual([]);
  });

  test("does not reset an active recovery cadence when several outage signals arrive", () => {
    const timer = createTimerHarness();
    let reconnects = 0;
    const scheduler = createPlaybackHostReconnectScheduler({
      clearTimer: timer.clearTimer,
      delaysMs: [250, 500, 1_000],
      onReconnect: () => {
        reconnects += 1;
      },
      setTimer: timer.setTimer,
    });

    scheduler.start();
    scheduler.notifyConnectionClosed();
    scheduler.notifyConnectionClosed();
    expect(reconnects).toBe(1);
    expect(timer.pendingDelays()).toEqual([250]);

    timer.fireNext();
    expect(reconnects).toBe(2);
    expect(timer.pendingDelays()).toEqual([500]);
  });
});
