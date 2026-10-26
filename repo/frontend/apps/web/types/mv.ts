export type MvQueryId = number | string | null | undefined;

export type MvQualityPlaybackTarget = Pick<
  HTMLVideoElement,
  "volume" | "muted" | "playbackRate" | "currentTime" | "duration" | "pause"
>;

export interface MvQualityPlaybackSnapshot {
  currentTime: number;
  paused: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
}

export interface MvQueryOptions {
  enabled?: boolean;
  /** 在已迁移的业务区域内将首次读取错误交给 QueryBoundary。 */
  boundary?: boolean;
}

export interface MvSubscriptionVariables {
  mvid: number | string;
  subscribe: boolean;
}

export interface MvLikeVariables {
  mvid: number | string;
  liked: boolean;
}

/** 自定义 MV 播放控件读取的 video 状态（秒、0–1 音量）。 */
export interface MvVideoState {
  buffered: number;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
}
