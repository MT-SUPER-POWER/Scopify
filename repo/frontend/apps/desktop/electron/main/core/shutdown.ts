export interface BeforeQuitEvent {
  preventDefault(): void;
}

export interface ApplicationShutdownOptions {
  dispose(): Promise<void>;
  onError?(error: unknown): void;
  onStarted?(): void;
  requestQuit(): void;
}

/**
 * Turns Electron's synchronous before-quit event into one bounded cleanup
 * transaction. The second app.quit() is allowed through only after async Main
 * capabilities (notably the MCP listener) have released their resources.
 */
export function createApplicationShutdown(options: ApplicationShutdownOptions) {
  let completed = false;
  let pending: Promise<void> | null = null;

  return {
    handleBeforeQuit(event: BeforeQuitEvent): Promise<void> | null {
      if (completed) return null;
      event.preventDefault();
      if (pending) return pending;

      options.onStarted?.();
      pending = Promise.resolve()
        .then(options.dispose)
        .catch((error) => options.onError?.(error))
        .then(() => {
          completed = true;
          options.requestQuit();
        });
      return pending;
    },
  };
}
