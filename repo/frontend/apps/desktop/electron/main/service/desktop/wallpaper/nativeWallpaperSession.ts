import { z } from "zod";

import type {
  NativeWallpaperSessionModule,
  NativeWallpaperSession,
  NativeWallpaperSessionOptions,
  PendingNativeWallpaperAttach,
} from "@/types/nativeWallpaper";

const attachmentSchema = z.object({
  event: z.literal("attached"),
  hwnd: z.number(),
  mode: z.enum(["classic", "raised", "macos-desktop"]),
  workerw: z.number(),
});

/** Owns cancellation and acknowledgements for the same ABI on both operating systems. */
export function createNativeWallpaperSession(
  native: NativeWallpaperSessionModule,
  options: NativeWallpaperSessionOptions = {},
): NativeWallpaperSession {
  let requested = false;
  let stopping = false;
  let failed = false;
  let lastEventAt = 0;
  let expectsHeartbeat = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pendingAttach: PendingNativeWallpaperAttach | null = null;
  let pendingDetach: ((success: boolean) => void) | null = null;
  let detachPromise: Promise<boolean> | null = null;

  const stopPolling = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };
  const fail = (error: Error) => {
    if (failed) return;
    failed = true;
    const wasStarting = Boolean(pendingAttach);
    pendingAttach?.reject(error);
    if (stopping) pendingDetach?.(false);
    if (!stopping && !wasStarting) options.onLost?.(error.message);
  };
  const poll = () => {
    try {
      for (const line of native.pollEvents()) {
        const event: unknown = JSON.parse(line);
        lastEventAt = Date.now();
        const attachment = attachmentSchema.safeParse(event);
        if (attachment.success) {
          expectsHeartbeat = attachment.data.mode !== "macos-desktop";
          pendingAttach?.resolve({
            hwnd: attachment.data.hwnd,
            mode: attachment.data.mode,
            workerW: attachment.data.workerw,
          });
        } else if (event && typeof event === "object" && "event" in event) {
          if (event.event === "detached") {
            requested = false;
            stopPolling();
            pendingDetach?.(true);
            if (!stopping) fail(new Error("The native wallpaper session ended unexpectedly."));
          } else if (event.event === "error") {
            fail(
              new Error("message" in event ? String(event.message) : "Native wallpaper failed."),
            );
          }
        }
      }
      if (
        requested &&
        !stopping &&
        !pendingAttach &&
        expectsHeartbeat &&
        Date.now() - lastEventAt > 15_000
      ) {
        fail(new Error("The native wallpaper message thread stopped responding."));
      }
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const detach = () => {
    if (detachPromise) return detachPromise;
    if (!requested) return Promise.resolve(true);
    stopping = true;
    detachPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => finish(false), options.detachTimeoutMs ?? 5_000);
      const finish = (success: boolean) => {
        clearTimeout(timeout);
        pendingDetach = null;
        resolve(success);
      };
      pendingDetach = finish;
      try {
        native.detach();
        poll();
      } catch {
        finish(false);
      }
    }).finally(() => {
      detachPromise = null;
    });
    return detachPromise;
  };

  return {
    attach(handle, bounds, primaryHeight, signal) {
      if (signal.aborted) return Promise.reject(abortError());
      if (requested)
        return Promise.reject(new Error("The previous wallpaper session has not detached."));
      requested = true;
      stopping = false;
      failed = false;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => finish(new Error("Native wallpaper attach timed out.")),
          options.attachTimeoutMs ?? 10_000,
        );
        const onAbort = () => finish(abortError());
        const cleanup = () => {
          clearTimeout(timeout);
          signal.removeEventListener("abort", onAbort);
          pendingAttach = null;
        };
        const finish = (error: Error) => {
          cleanup();
          reject(error);
        };
        pendingAttach = {
          reject: finish,
          resolve: (attachment) => {
            cleanup();
            resolve(attachment);
          },
        };
        signal.addEventListener("abort", onAbort, { once: true });
        pollTimer = setInterval(poll, options.pollIntervalMs ?? 50);
        pollTimer.unref?.();
        try {
          native.attach(handle, bounds.x, bounds.y, bounds.width, bounds.height, primaryHeight);
          poll();
        } catch (error) {
          // Synchronous validation failures never created a backend session.
          requested = false;
          stopPolling();
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
    detach,
    async dispose() {
      await detach();
      stopPolling();
    },
    isAttached: () => requested && native.isAttached(),
  };
}

function abortError() {
  const error = new Error("Native wallpaper operation was cancelled.");
  error.name = "AbortError";
  return error;
}
