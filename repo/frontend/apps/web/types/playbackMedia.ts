import type { AudioHTMLAttributes, MutableRefObject, ReactNode } from "react";

export interface PlaybackMediaRuntimeProviderProps {
  children: ReactNode;
}

/** The refs and guards shared by source loading, DOM event handling and the Authority. */
export interface PlaybackMediaSourceState {
  /** The adapter validates the active source against the current store revision. */
  isActiveMediaSource(): boolean;
  isMediaSourceLoadingRef: MutableRefObject<boolean>;
  isPlaybackSessionCurrent(sessionKey: string | null): boolean;
  mediaSourceLoadRevisionRef: MutableRefObject<number>;
}

export type PlaybackMediaEventHandlers = Pick<
  AudioHTMLAttributes<HTMLAudioElement>,
  | "onCanPlay"
  | "onDurationChange"
  | "onError"
  | "onPause"
  | "onPlaying"
  | "onProgress"
  | "onTimeUpdate"
>;
