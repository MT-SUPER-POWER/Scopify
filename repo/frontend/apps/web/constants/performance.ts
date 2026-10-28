import type { TranslationKey } from "@/lib/i18n";
import type { PlaybackProgressRefreshRate } from "@/types/app/performance";

export const PERFORMANCE_STORAGE_KEY = "performance-storage";

export const PLAYBACK_PROGRESS_REFRESH_RATES = ["display", "60", "30"] as const;

export const PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS: Record<
  PlaybackProgressRefreshRate,
  TranslationKey
> = {
  display: "settings.progressRefreshRate.display",
  "60": "settings.progressRefreshRate.60",
  "30": "settings.progressRefreshRate.30",
};

/** Follows the display; users on 120–180 Hz screens can trade smoothness for CPU. */
export const DEFAULT_PLAYBACK_PROGRESS_REFRESH_RATE: PlaybackProgressRefreshRate = "display";

/**
 * Minimum gap between position samples. Each sample re-renders its consumer; the 2 ms slack
 * absorbs vsync jitter so a matching display still updates on every frame.
 */
export const PLAYBACK_PROGRESS_SAMPLE_INTERVAL_MS: Record<PlaybackProgressRefreshRate, number> = {
  display: 0,
  "60": 1_000 / 60 - 2,
  "30": 1_000 / 30 - 2,
};
