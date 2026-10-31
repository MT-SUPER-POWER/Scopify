export interface BeforeQuitEvent {
  preventDefault(): void;
}

export interface ApplicationShutdownOptions {
  dispose(): Promise<void>;
  onError?(error: unknown): void;
  onStarted?(): void;
  exit(): void;
  timeoutMs?: number;
}

/** All quit requests share one cleanup transaction, then exit without another window-close negotiation. */
export function createApplicationShutdown(options: ApplicationShutdownOptions) {
  let completed = false;
  let pending: Promise<void> | null = null;
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  const finish = () => {
    if (completed) return;
    completed = true;
    if (exitTimer) clearTimeout(exitTimer);
    exitTimer = null;
    options.exit();
  };

  return {
    handleBeforeQuit(event: BeforeQuitEvent): Promise<void> | null {
      if (completed) return null;
      event.preventDefault();
      if (pending) return pending;

      exitTimer = setTimeout(() => {
        try {
          options.onError?.(new Error("Application shutdown exceeded its deadline."));
        } finally {
          finish();
        }
      }, options.timeoutMs ?? 5_000);
      exitTimer.unref();
      options.onStarted?.();
      pending = Promise.resolve()
        .then(options.dispose)
        .catch((error) => options.onError?.(error))
        .finally(finish);
      return pending;
    },
  };
}
