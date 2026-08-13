import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackMessage,
  PlaybackProjection,
  PlaybackTransportPayload,
  PlaybackTransportRole,
} from "@scopifymusicplayer/desktop-contract";
import type { ReactNode } from "react";

import type { PlaybackAuthorityBinding } from "@/types/playbackAuthority";
import type { PlaybackClock, PlaybackProjectionSource } from "@/types/playbackProjection";

export interface PlaybackProjectionProviderProps<TLyrics = unknown> {
  children: ReactNode;
  source: PlaybackProjectionSource<TLyrics>;
}

export interface PlaybackProjectionExternalStore<TLyrics = unknown> {
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
  getSnapshot(): PlaybackProjection<TLyrics>;
  samplePositionMs(): number;
  subscribe(listener: () => void): () => void;
}

export interface PlaybackCommands {
  next(): Promise<PlaybackCommandReceipt>;
  pause(): Promise<PlaybackCommandReceipt>;
  play(): Promise<PlaybackCommandReceipt>;
  previous(): Promise<PlaybackCommandReceipt>;
  seek(positionMs: number): Promise<PlaybackCommandReceipt>;
  setVolume(volume: number): Promise<PlaybackCommandReceipt>;
  toggle(): Promise<PlaybackCommandReceipt>;
  toggleLike(): Promise<PlaybackCommandReceipt>;
}

/** Structurally compatible with the renderer runtime's playback transport module. */
export interface PlaybackRendererPort<TLyrics = unknown> {
  connect(
    role: PlaybackTransportRole,
    connectionId: string,
    onPayload: (payload: PlaybackTransportPayload<TLyrics>) => void,
    onClose: () => void,
  ): () => void;
  send(payload: PlaybackTransportPayload<TLyrics>): boolean;
}

export interface ElectronPlaybackReplicaTransportOptions<TLyrics = unknown> {
  clock: PlaybackClock;
  commandTimeoutMs?: number;
  connectionId: string;
  disconnectAfterMs?: number;
  port: PlaybackRendererPort<TLyrics>;
}

export interface ElectronPlaybackReplicaTransport<TLyrics = unknown> {
  close(): void;
  readonly source: PlaybackProjectionSource<TLyrics>;
}

export interface ElectronPlaybackAuthorityTransportOptions<TLyrics = unknown> {
  connectionId: string;
  port: PlaybackRendererPort<TLyrics>;
}

export interface ElectronPlaybackAuthorityTransport<TLyrics = unknown> {
  close(): void;
  connectAuthority(binding: PlaybackAuthorityBinding): () => void;
  publish(message: PlaybackMessage<TLyrics>): boolean;
}
