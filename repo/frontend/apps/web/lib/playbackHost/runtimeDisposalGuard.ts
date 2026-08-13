export interface PlaybackHostRuntimeDisposalTimer<Handle> {
  clearTimeout(handle: Handle): void;
  setTimeout(callback: () => void, delayMs: number): Handle;
}

export interface PlaybackHostRuntimeDisposalGuard {
  cancel(): void;
  schedule(dispose: () => void): void;
}

/**
 * React Strict Effects intentionally run an effect cleanup and immediate setup
 * once in development. Defer Host teardown by one task so that replay cancels
 * the teardown, while a real unmount still releases the media authority.
 */
export const playbackHostRuntimeDisposalTimer = {
  clearTimeout(handle: ReturnType<typeof setTimeout>) {
    globalThis.clearTimeout(handle);
  },
  setTimeout(callback: () => void, delayMs: number) {
    return globalThis.setTimeout(callback, delayMs);
  },
} satisfies PlaybackHostRuntimeDisposalTimer<ReturnType<typeof setTimeout>>;

export function createPlaybackHostRuntimeDisposalGuard<Handle>(
  timer: PlaybackHostRuntimeDisposalTimer<Handle>,
): PlaybackHostRuntimeDisposalGuard {
  let handle: Handle | null = null;
  let generation = 0;

  return {
    cancel() {
      generation += 1;
      if (handle === null) return;
      timer.clearTimeout(handle);
      handle = null;
    },
    schedule(dispose) {
      const scheduledGeneration = ++generation;
      if (handle !== null) timer.clearTimeout(handle);
      handle = timer.setTimeout(() => {
        if (scheduledGeneration !== generation) return;
        handle = null;
        dispose();
      }, 0);
    },
  };
}
