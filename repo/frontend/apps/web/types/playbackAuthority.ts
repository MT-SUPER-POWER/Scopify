import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackMessage,
  PlaybackSessionState,
  PlaybackTimelineDiscontinuityReason,
} from "@scopify/desktop-contract";
import type { ReactNode, RefObject } from "react";

import type { PlaybackClock, PlaybackProjectionSource } from "@/types/playbackProjection";
import type { HtmlAudioEngineAdapter } from "@/lib/player/adapters/htmlAudioEngineAdapter";

export type PlaybackAuthorityMediaEvent =
  | "can-play"
  | "duration-change"
  | "ended"
  | "error"
  | "load-start"
  | "pause"
  | "playing"
  | "rate-change"
  | "waiting";

export interface PlaybackMediaSample {
  durationMs: number;
  ended: boolean;
  errorMessage: string | null;
  paused: boolean;
  playbackRate: number;
  positionMs: number;
  volume: number;
}

export interface PlaybackMediaPort {
  getSample(): PlaybackMediaSample;
  pause(): void;
  play(): Promise<void>;
  seek(positionMs: number): void;
  setVolume(volume: number): void;
  subscribe(listener: (event: PlaybackAuthorityMediaEvent) => void): () => void;
}

export interface PlaybackAuthorityScheduler {
  clearInterval(handle: unknown): void;
  setInterval(callback: () => void, intervalMs: number): unknown;
}

export interface PlaybackAuthorityIdentityFactory {
  createAuthorityId(): string;
  createSessionId(): string;
}

/** Immutable identity for the currently running Authority lifecycle and media session. */
export interface PlaybackAuthorityIdentity {
  readonly authorityId: string;
  readonly sessionId: string;
}

export interface PlaybackAuthorityStatePatch<TLyrics = unknown> {
  canControl?: boolean;
  liked?: boolean;
  lyrics?: TLyrics | null;
  lyricsVersion?: number | string | null;
  track?: PlaybackSessionState<TLyrics>["track"];
  volume?: number;
}

export interface PlaybackAuthorityCallbacks {
  ensureSource?(): boolean | Promise<boolean>;
  moveQueueItem?(fromIndex: number, toIndex: number): Promise<void> | void;
  next?(): Promise<void> | void;
  onEnded?(): Promise<void> | void;
  onError?(message: string | null): Promise<void> | void;
  onPhaseChange?(phase: PlaybackSessionState["phase"]): void;
  onVolumeChange?(volume: number): void;
  playQueueIndex?(index: number): Promise<void> | void;
  previous?(): Promise<void> | void;
  removeQueueItem?(index: number): Promise<void> | void;
  toggleLike?(): boolean | Promise<boolean | void> | void;
}

export interface PlaybackAuthorityProviderProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  /** Phase-one Web adapter; future Native implementations supply the same port seam. */
  audioEngine: HtmlAudioEngineAdapter | null;
  children: ReactNode;
  isMediaSourceLoadingRef: RefObject<boolean>;
  mediaSourceLoadRevisionRef: RefObject<number>;
}

export interface PlaybackAuthorityOptions<TLyrics = unknown> {
  callbacks?: PlaybackAuthorityCallbacks;
  clock: PlaybackClock;
  healthAnchorIntervalMs?: number;
  identityFactory?: PlaybackAuthorityIdentityFactory;
  media: PlaybackMediaPort;
  publish(message: PlaybackMessage<TLyrics>): void;
  scheduler: PlaybackAuthorityScheduler;
}

export interface PlaybackSessionStartOptions {
  causedByCommandId?: string;
  positionMs?: number;
  reason?: Extract<PlaybackTimelineDiscontinuityReason, "replay" | "resume" | "track-change">;
}

export interface PlaybackAuthorityBinding {
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
  requestBootstrap(): void;
}

export interface InProcessProjectionConnection<
  TLyrics = unknown,
> extends PlaybackProjectionSource<TLyrics> {
  disconnect(): void;
}

export interface InProcessPlaybackTransport<TLyrics = unknown> {
  connectAuthority(binding: PlaybackAuthorityBinding): () => void;
  connectProjection(
    source: PlaybackProjectionSource<TLyrics>,
    receive: (message: PlaybackMessage<TLyrics>) => void,
  ): InProcessProjectionConnection<TLyrics>;
  publish(message: PlaybackMessage<TLyrics>): void;
}

export interface InProcessPlaybackTransportOptions {
  onDeliveryError?(error: unknown): void;
}

export interface UsePlaybackAuthorityOptions<TLyrics = unknown> {
  acceptMediaEvent?(event: PlaybackAuthorityMediaEvent): boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  callbacks?: PlaybackAuthorityCallbacks;
  clock?: PlaybackClock;
  healthAnchorIntervalMs?: number;
  identityFactory?: PlaybackAuthorityIdentityFactory;
  initialState: PlaybackSessionState<TLyrics>;
  audioEngine: HtmlAudioEngineAdapter | null;
  resumePositionMs?: number;
  scheduler?: PlaybackAuthorityScheduler;
  sessionKey: string;
  sessionReason?: PlaybackSessionStartOptions["reason"];
  transport: InProcessPlaybackTransport<TLyrics>;
}
