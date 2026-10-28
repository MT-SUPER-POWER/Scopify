import type { AudioFeatureFrameV1 } from "@scopify/desktop-contract";

import type { LyricAudioBands } from "@/types/lyrics";

export interface AudioFeatureStreamIdentity {
  authorityId: string;
  sessionId: string;
}

export interface AudioFeatureStream extends AudioFeatureStreamIdentity {
  nextSequence(): number;
  streamId: string;
}

export interface AudioFeatureStreamOptions {
  createStreamId?(): string;
}

export interface PlaybackFeatureIdentity {
  authorityId: string;
  sessionId: string;
}

export interface PlaybackFeaturePublisher {
  setIdentity(identity: PlaybackFeatureIdentity | null): void;
  stop?(): void;
}

export interface AudioFeatureBands {
  bass: number;
  lowMid: number;
  mid: number;
  power: number;
  spectrum: ReadonlyArray<number>;
  treble: number;
  vocal: number;
}

export interface AudioFeatureFrameSink {
  publish(frame: AudioFeatureFrameV1): boolean;
}

export interface AudioFeatureSamplerOptions {
  createStream?: (identity: PlaybackFeatureIdentity) => AudioFeatureStream;
  nowMs?: () => number;
  sink: AudioFeatureFrameSink;
}

export interface AudioFeatureSource {
  readBands(): LyricAudioBands | null;
}

export interface AnalyserAudioFeatureSourceOptions {
  analyser: AnalyserNode;
  isPaused: () => boolean;
}

export interface AudioFeatureSourceSamplerTimer {
  clearInterval(handle: ReturnType<typeof setInterval>): void;
  setInterval(callback: () => void, intervalMs: number): ReturnType<typeof setInterval>;
}

export interface AudioFeatureSourceSamplerOptions {
  getProjection: () => import("@scopify/desktop-contract").PlaybackProjection;
  getSource?: () => AudioFeatureSource | null;
  intervalMs?: number;
  nowMs?: () => number;
  publish: (frame: AudioFeatureFrameV1) => boolean;
  timer?: AudioFeatureSourceSamplerTimer;
}

/** Timer seam for the publisher transport lifecycle. */
export interface AudioFeaturePublisherTimer {
  clearTimeout(handle: unknown): void;
  setTimeout(callback: () => void, delayMs: number): unknown;
}

/** The fixed-rate source sampler controlled by the transport lifecycle. */
export interface AudioFeaturePublisherSampler {
  disconnect(): void;
  start(): void;
  stop(): void;
}

/** Narrow publisher-only view of the high-frequency transport. */
export interface AudioFeaturePublisherTransport {
  connect(
    role: "publisher",
    connectionId: string,
    onFrame: (frame: AudioFeatureFrameV1) => void,
    onClose: () => void,
  ): () => void;
}

export interface AudioFeaturePublisherConnectionOptions {
  connectionId: string;
  reconnectDelayMs: number;
  sampler: AudioFeaturePublisherSampler;
  timer?: AudioFeaturePublisherTimer;
  transport: AudioFeaturePublisherTransport;
}

/** Explicit lifecycle keeps React as a thin mount/unmount adapter. */
export interface AudioFeaturePublisherConnection {
  dispose(): void;
  start(): void;
}
