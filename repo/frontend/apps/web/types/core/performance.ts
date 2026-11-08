import type { PLAYBACK_PROGRESS_REFRESH_RATES } from "@/constants/performance";

export type PlaybackProgressRefreshRate = (typeof PLAYBACK_PROGRESS_REFRESH_RATES)[number];

export interface DisplayRefreshRateReading {
  hz: number;
  estimated: boolean;
}

export interface PerformanceStore {
  progressRefreshRate: PlaybackProgressRefreshRate;
  setProgressRefreshRate: (rate: PlaybackProgressRefreshRate) => void;
}
