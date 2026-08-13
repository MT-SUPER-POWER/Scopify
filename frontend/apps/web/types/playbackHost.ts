import type { AudioHTMLAttributes, MutableRefObject, ReactNode } from "react";

import type { PlaybackProjectionSource } from "@/types/playbackProjection";
import type { PlaybackAuthorityExternalSessionControl } from "@/types/playbackAuthority";
import type { PlaybackAuthority } from "@/lib/playbackProjection/authority";
import type { LyricData } from "@/types/lyrics";

export interface PlaybackMediaRuntimeProviderProps {
  /** Only the hidden host supplies this in Electron; browser mode remains fully in-process. */
  authorityConnectionId?: string;
  children: ReactNode;
  /** Dedicated Host callbacks that keep queue and source ownership outside Zustand actions. */
  externalSessionControl?: PlaybackAuthorityExternalSessionControl;
  onAuthorityConnected?(authority: PlaybackAuthority<LyricData>): void;
}

export interface DesktopMainPlaybackReplicaProviderProps {
  children: ReactNode;
}

/** Timer abstraction keeps Host control-port recovery deterministic in tests. */
export interface PlaybackHostReconnectSchedulerOptions {
  clearTimer(handle: unknown): void;
  delaysMs: readonly number[];
  onReconnect(): void;
  setTimer(callback: () => void, delayMs: number): unknown;
}

export interface PlaybackHostReconnectScheduler {
  close(): void;
  notifyConnectionClosed(): void;
  notifySnapshot(): void;
  start(): void;
}

/** The refs and guards shared by source loading, DOM event handling and the Authority. */
export interface PlaybackMediaSourceState {
  isActiveMediaSource(audio: HTMLAudioElement): boolean;
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

/** A source whose backing Electron Replica can be exchanged without remounting React consumers. */
export interface SwappablePlaybackProjectionSource<
  TLyrics = unknown,
> extends PlaybackProjectionSource<TLyrics> {
  replaceSource(source: PlaybackProjectionSource<TLyrics>): void;
}
