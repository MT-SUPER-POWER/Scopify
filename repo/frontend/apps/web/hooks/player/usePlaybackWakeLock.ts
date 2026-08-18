"use client";

import { useEffect } from "react";

interface ScreenWakeLockSentinel extends EventTarget {
  release: () => Promise<void>;
  released: boolean;
}

interface WakeLockNavigator extends Navigator {
  wakeLock?: {
    request: (type: "screen") => Promise<ScreenWakeLockSentinel>;
  };
}

/** Keeps the Folia stage awake while music is actively playing. */
export function usePlaybackWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined") return;
    const wakeLock = (navigator as WakeLockNavigator).wakeLock;
    if (!wakeLock) return;

    let sentinel: ScreenWakeLockSentinel | null = null;
    let disposed = false;
    const acquire = async () => {
      if (disposed || document.visibilityState !== "visible" || sentinel) return;
      try {
        sentinel = await wakeLock.request("screen");
        sentinel.addEventListener("release", () => {
          sentinel = null;
        });
      } catch {
        // Wake Lock can be denied by the browser or operating system.
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
      sentinel = null;
    };
  }, [enabled]);
}
