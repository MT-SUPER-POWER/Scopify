"use client";

import { useEffect, useState } from "react";
import { runtime } from "@/lib/runtime";
import { estimateDisplayRefreshRate } from "@/lib/settings/displayRefreshRate";
import type { DisplayRefreshRateReading } from "@/types/core/performance";

/** Samples only while settings are mounted and visible; never keeps a permanent frame loop. */
export function useDisplayRefreshRate() {
  const [reading, setReading] = useState<DisplayRefreshRateReading | null>(null);

  useEffect(() => {
    let disposed = false;
    let revision = 0;
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let nativeFailureReported = false;

    const refresh = async () => {
      const currentRevision = ++revision;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      if (document.visibilityState !== "visible") return;

      if (runtime.isDesktop) {
        try {
          const hz = await runtime.window.getDisplayRefreshRate();
          if (!disposed && currentRevision === revision) {
            setReading(
              hz !== null && Number.isFinite(hz) && hz > 0
                ? { hz: Math.round(hz), estimated: false }
                : null,
            );
          }
        } catch (error) {
          if (!disposed && currentRevision === revision) {
            setReading(null);
            if (!nativeFailureReported) {
              nativeFailureReported = true;
              console.warn(
                "Unable to read the display refresh rate. Restart the desktop host if its preload bridge has not been updated.",
                error,
              );
            }
          }
        }
        return;
      }

      const timestamps: number[] = [];
      timeout = setTimeout(() => {
        cancelAnimationFrame(frame);
        if (!disposed && currentRevision === revision) setReading(null);
      }, 2500);
      const sample = (timestamp: number) => {
        if (disposed || currentRevision !== revision) return;
        timestamps.push(timestamp);
        if (timestamps.length < 49) {
          frame = requestAnimationFrame(sample);
          return;
        }
        clearTimeout(timeout);
        const hz = estimateDisplayRefreshRate(timestamps.slice(8));
        setReading(hz === null ? null : { hz, estimated: true });
      };
      frame = requestAnimationFrame(sample);
    };

    const update = () => {
      void refresh();
    };
    update();
    const interval = setInterval(update, 5000);
    window.addEventListener("focus", update);
    window.addEventListener("resize", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      revision += 1;
      clearInterval(interval);
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      window.removeEventListener("focus", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return reading;
}
