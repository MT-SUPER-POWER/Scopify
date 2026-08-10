import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackMessage,
  PlaybackSessionState,
  PlaybackTimelineDiscontinuityReason,
} from "@scopify/desktop-contract";
import type { ReactNode, RefObject } from "react";

import type { PlaybackClock, PlaybackProjectionSource } from "@/types/playbackProjection";

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
  next?(): Promise<void> | void;
  onEnded?(): Promise<void> | void;
  onError?(message: string | null): Promise<void> | void;
  onPhaseChange?(phase: PlaybackSessionState["phase"]): void;
  onVolumeChange?(volume: number): void;
  previous?(): Promise<void> | void;
  toggleLike?(): boolean | Promise<boolean | void> | void;
}

export interface PlaybackAuthorityProviderProps {
  audioRef: RefObject<HTMLAudioElement | null>;
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
  resumePositionMs?: number;
  scheduler?: PlaybackAuthorityScheduler;
  sessionKey: string;
  sessionReason?: PlaybackSessionStartOptions["reason"];
  transport: InProcessPlaybackTransport<TLyrics>;
}
