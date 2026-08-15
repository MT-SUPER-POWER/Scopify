import {
  AUDIO_FEATURE_PROTOCOL_VERSION,
  type AudioFeatureFrameV1,
} from "@scopify/desktop-contract";

import { createAudioFeatureStream } from "@/lib/audioFeature/stream";
import type {
  AudioFeatureBands,
  AudioFeatureStream,
  AudioFeatureSamplerOptions,
  PlaybackFeatureIdentity,
  PlaybackFeaturePublisher,
} from "@/types/audioFeaturePublisher";

/** Adds a versioned transport envelope to analyser-derived audio values. */
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
    } satisfies AudioFeatureFrameV1);
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
