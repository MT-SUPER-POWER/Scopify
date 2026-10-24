import type { PlaybackClockAnchor } from "@scopify/desktop-contract";

import type { PlaybackGateway } from "@/types/service/playback/gateway";

/** The subset of BrowserWindow the taskbar progress service drives. */
export interface TaskbarProgressWindow {
  isDestroyed(): boolean;
  setProgressBar(progress: number, options?: { mode: "normal" | "paused" }): void;
}

/** `progress` is 0~1, or -1 to clear the bar. */
export interface TaskbarProgressState {
  mode: "normal" | "paused";
  progress: number;
}

export interface TaskbarProgressServiceOptions {
  getPlaybackAnchor(): PlaybackClockAnchor | null;
  playback: PlaybackGateway;
  window: TaskbarProgressWindow;
}

export interface TaskbarProgressService {
  dispose(): void;
}
