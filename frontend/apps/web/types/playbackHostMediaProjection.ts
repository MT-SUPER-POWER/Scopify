import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackHostMusicQuality,
  PlaybackHostPlaybackIntent,
  PlaybackPhase,
  PlaybackSessionState,
  PlaybackTrack,
} from "@scopify/desktop-contract";

import type { PlaybackRuntimeSession, PlaybackSourceRequest } from "@/lib/playbackHost/catalog";
import type {
  PlaybackRuntimeAuthorityPort,
  PlaybackSourcePreparation,
} from "@/lib/playbackHost/runtime";
import type { ResolvedPlaybackSource } from "@/types/playbackHostCatalog";

/** A resolver result whose lyric payload agrees with the Runtime session. */
export type PlaybackHostResolvedSource<TLyrics = ResolvedPlaybackSource["lyrics"]> = Omit<
  ResolvedPlaybackSource,
  "lyrics"
> & {
  lyrics: TLyrics | null;
};

/**
 * All durable Player-facing media fields. This is deliberately store-neutral:
 * the Host integration can translate this transaction to Zustand, another
 * renderer state container, or a test double without leaking either choice.
 */
export interface PlaybackHostPlayerMediaProjection<TLyrics = unknown> {
  currentTrack: PlaybackTrack | null;
  durationMs: number;
  intent: PlaybackHostPlaybackIntent;
  lyrics: TLyrics | null;
  phase: PlaybackPhase;
  quality: PlaybackHostMusicQuality;
  sessionKey: string;
  sourceLoadRevision: number;
  sourceUrl: string | null;
  volume: number;
}

/** Timeline fields that have to change together with the media session. */
export interface PlaybackHostTimeMediaProjection {
  positionMs: number;
  totalTimeMs: number;
}

/**
 * The one atomic handoff from the Host's Runtime/Catalog boundary into UI
 * state. Implementations must commit both projections as one state update.
 */
export interface PlaybackHostMediaProjectionTransaction<TLyrics = unknown> {
  player: PlaybackHostPlayerMediaProjection<TLyrics>;
  time: PlaybackHostTimeMediaProjection;
}

export interface PlaybackHostMediaProjectionPort<TLyrics = unknown> {
  apply(transaction: PlaybackHostMediaProjectionTransaction<TLyrics>): void;
}

/** Runtime data plus the control fields intentionally absent from RuntimeSession. */
export interface PlaybackHostRuntimeSessionProjectionInput<TLyrics = unknown> {
  intent: PlaybackHostPlaybackIntent;
  quality: PlaybackHostMusicQuality;
  session: PlaybackRuntimeSession<TLyrics>;
}

/** A resolver result can be applied only to this exact Runtime source request. */
export interface PlaybackHostResolvedSourceProjectionInput<TLyrics = unknown> {
  /** The catalog's abort/sequence guard; false means no state may be committed. */
  isCurrent?: () => boolean;
  request: PlaybackSourceRequest<TLyrics>;
  resolved: PlaybackHostResolvedSource<TLyrics>;
}

/** The minimal controller surface needed by the Authority's ended callback. */
export interface PlaybackHostEndedPort {
  handleEnded(): Promise<boolean>;
}

/**
 * Imperative surface supplied after the React Authority is mounted. Keeping
 * this binding narrow prevents the control/runtime layer from importing React
 * or the Host's state store.
 */
export interface PlaybackHostAuthorityBinding<
  TLyrics = unknown,
> extends PlaybackRuntimeAuthorityPort<TLyrics> {
  ensureSource(): PlaybackSourcePreparation | Promise<PlaybackSourcePreparation>;
}

/** Deferred version of the Runtime Authority port used during Host hydration. */
export interface PlaybackHostAuthorityPortProxy<
  TLyrics = unknown,
> extends PlaybackRuntimeAuthorityPort<TLyrics> {
  bind(binding: PlaybackHostAuthorityBinding<TLyrics>): () => void;
  ensureSource(): Promise<PlaybackSourcePreparation>;
  isBound(): boolean;
  unbind(): void;
}

/** Convenience shape for React adapters that expose a dispatch method only. */
export interface PlaybackHostAuthorityDispatchPort {
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
}

/** Ensures the Runtime state is retained in declarations emitted by consumers. */
export type PlaybackHostRuntimeSessionState<TLyrics = unknown> = PlaybackSessionState<TLyrics>;
