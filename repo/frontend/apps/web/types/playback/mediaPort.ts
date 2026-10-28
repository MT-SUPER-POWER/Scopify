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

/** Minimal synchronous media surface consumed by the projection Authority. */
export interface PlaybackMediaPort {
  getSample(): PlaybackMediaSample;
  pause(): void;
  play(): Promise<void>;
  seek(positionMs: number): void;
  setVolume(volume: number): void;
  subscribe(listener: (event: PlaybackAuthorityMediaEvent) => void): () => void;
}
