import {
  AUDIO_FEATURE_PROTOCOL_VERSION,
  type AudioFeatureFrameV1,
} from "@scopify/desktop-contract";

import { createAudioFeatureStream, type AudioFeatureStream } from "@/lib/audioFeature/stream";

/** The Authority/session pair that scopes every high-frequency feature stream. */
export interface PlaybackFeatureIdentity {
  authorityId: string;
  sessionId: string;
}

/**
 * Runtime only needs identity lifecycle notifications. Implementations may
 * additionally sample an AnalyserNode and publish frames over the best-effort
 * Audio Feature transport.
 */
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

/**
 * Adds the transport envelope to analyser-derived values. It deliberately does
 * not own an animation loop: the host chooses sampling cadence, while this
 * object guarantees a fresh stream on every Authority/session change.
 */
export class AudioFeatureSampler implements PlaybackFeaturePublisher {
  private identity: PlaybackFeatureIdentity | null = null;
  private stream: AudioFeatureStream | null = null;

  constructor(private readonly options: AudioFeatureSamplerOptions) {}

  setIdentity(identity: PlaybackFeatureIdentity | null): void {
    if (
      this.identity?.authorityId === identity?.authorityId &&
      this.identity?.sessionId === identity?.sessionId
    ) {
      return;
    }

    this.identity = identity ? { ...identity } : null;
    this.stream = identity
      ? (this.options.createStream ?? createAudioFeatureStream)(identity)
      : null;
  }

  publish(bands: AudioFeatureBands): boolean {
    const stream = this.stream;
    if (!stream) return false;

    const published = this.options.sink.publish({
      authorityId: stream.authorityId,
      bass: clampMagnitude(bands.bass),
      lowMid: clampMagnitude(bands.lowMid),
      mid: clampMagnitude(bands.mid),
      power: clampMagnitude(bands.power),
      protocolVersion: AUDIO_FEATURE_PROTOCOL_VERSION,
      sampledAtMs: this.options.nowMs?.() ?? Date.now(),
      sequence: stream.nextSequence(),
      sessionId: stream.sessionId,
      spectrum: bands.spectrum.map(clampMagnitude),
      streamId: stream.streamId,
      treble: clampMagnitude(bands.treble),
      type: "audio-feature-frame",
      vocal: clampMagnitude(bands.vocal),
    });
    if (!published) this.stream = null;
    return published;
  }

  stop(): void {
    this.identity = null;
    this.stream = null;
  }
}

function clampMagnitude(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(255, value)) : 0;
}
