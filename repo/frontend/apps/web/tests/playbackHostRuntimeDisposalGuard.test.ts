import { expect, test } from "bun:test";

import { createPlaybackHostRuntimeDisposalGuard } from "@/lib/playbackHost/runtimeDisposalGuard";

class ManualTimer {
  readonly callbacks = new Map<number, () => void>();
  private nextHandle = 1;

  clearTimeout(handle: number) {
    this.callbacks.delete(handle);
  }

  setTimeout(callback: () => void): number {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    return handle;
  }

  flush() {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    callbacks.forEach((callback) => callback());
  }
}

test("preserves a Playback Host runtime through Strict Effects cleanup and immediate remount", () => {
  const timer = new ManualTimer();
  const guard = createPlaybackHostRuntimeDisposalGuard(timer);
  let disposeCount = 0;

  guard.schedule(() => {
    disposeCount += 1;
  });
  guard.cancel();
  timer.flush();

  expect(disposeCount).toBe(0);
});

test("disposes the Playback Host runtime after a real unmount", () => {
  const timer = new ManualTimer();
  const guard = createPlaybackHostRuntimeDisposalGuard(timer);
  let disposeCount = 0;

  guard.schedule(() => {
    disposeCount += 1;
  });
  timer.flush();

  expect(disposeCount).toBe(1);
});
