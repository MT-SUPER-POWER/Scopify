import type { PLAYBACK_PROGRESS_REFRESH_RATES } from "@/constants/performance";

export type PlaybackProgressRefreshRate = (typeof PLAYBACK_PROGRESS_REFRESH_RATES)[number];

export interface PerformanceStore {
  progressRefreshRate: PlaybackProgressRefreshRate;
  setProgressRefreshRate: (rate: PlaybackProgressRefreshRate) => void;
}
