export type MvQueryId = number | string | null | undefined;

export interface MvQueryOptions {
  enabled?: boolean;
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
