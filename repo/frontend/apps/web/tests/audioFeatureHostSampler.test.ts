import { describe, expect, test } from "bun:test";
import type { PlaybackProjection } from "@scopifymusicplayer/desktop-contract";

import {
  AUDIO_FEATURE_SAMPLE_INTERVAL_MS,
  AudioFeatureHostSampler,
  getAudioFeatureSource,
  registerAudioFeatureSource,
  type AudioFeatureSource,
} from "@/lib/audioFeature/source";

class ManualIntervalTimer {
  callback: (() => void) | null = null;
  cleared = false;
  handle: ReturnType<typeof setInterval> | null = null;
  intervalMs: number | null = null;

  clearInterval(handle: ReturnType<typeof setInterval>) {
    globalThis.clearInterval(handle);
    if (this.handle === handle) this.handle = null;
    this.callback = null;
    this.cleared = true;
  }

  fire() {
    this.callback?.();
  }

  setInterval(callback: () => void, intervalMs: number) {
    this.callback = callback;
    this.intervalMs = intervalMs;
    this.handle = globalThis.setInterval(() => undefined, 60_000);
    return this.handle;
  }
}

function projection(overrides: Partial<PlaybackProjection> = {}): PlaybackProjection {
  return {
    authorityId: "authority-a",
    canControl: true,
    connection: "connected",
    durationMs: 180_000,
    isPlaying: true,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "playing",
    positionMs: 12_000,
    sessionId: "session-a",
    track: { artistNames: ["Artist"], id: 1, title: "Song" },
    volume: 80,
    ...overrides,
  };
}

function bands() {
  return {
    bass: 24,
    lowMid: 36,
    mid: 48,
    power: 60,
    spectrum: Array.from({ length: 400 }, (_, index) => index % 256),
    treble: 72,
    vocal: 84,
  };
}

describe("AudioFeatureHostSampler", () => {
  test("samples the Host source every 33ms and sends only connected projection identities", () => {
    const timer = new ManualIntervalTimer();
    const frames: Array<Parameters<typeof samplerPublish>[0]> = [];
    let currentProjection = projection({ connection: "disconnected" });
    let reads = 0;
    const source: AudioFeatureSource = {
      readBands() {
        reads += 1;
        return bands();
      },
    };
    const sampler = new AudioFeatureHostSampler({
      getProjection: () => currentProjection,
      getSource: () => source,
      nowMs: () => 123,
      publish: (frame) => {
        frames.push(frame);
        return true;
      },
      timer,
    });

    sampler.start();
    expect(timer.intervalMs).toBe(AUDIO_FEATURE_SAMPLE_INTERVAL_MS);
    timer.fire();
    expect(reads).toBe(0);
    expect(frames).toHaveLength(0);

    currentProjection = projection();
    timer.fire();
    expect(reads).toBe(1);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      authorityId: "authority-a",
      sampledAtMs: 123,
      sequence: 0,
      sessionId: "session-a",
    });
    expect(frames[0]?.spectrum).toHaveLength(256);

    sampler.stop();
    expect(timer.cleared).toBeTrue();
    timer.fire();
    expect(frames).toHaveLength(1);
  });

  test("skips paused or unavailable analysers and replaces the stream after an identity or transport change", () => {
    const frames: Array<Parameters<typeof samplerPublish>[0]> = [];
    let currentProjection = projection();
    let isPaused = true;
    let acceptsFrames = true;
    const sampler = new AudioFeatureHostSampler({
      getProjection: () => currentProjection,
      getSource: () => ({ readBands: () => (isPaused ? null : bands()) }),
      publish: (frame) => {
        frames.push(frame);
        return acceptsFrames;
      },
    });

    expect(sampler.sample()).toBeFalse();
    expect(frames).toHaveLength(0);

    isPaused = false;
    expect(sampler.sample()).toBeTrue();
    const firstStreamId = frames[0]?.streamId;
    expect(sampler.sample()).toBeTrue();
    expect(frames[1]).toMatchObject({ sequence: 1, streamId: firstStreamId });

    currentProjection = projection({ sessionId: "session-b" });
    expect(sampler.sample()).toBeTrue();
    expect(frames[2]).toMatchObject({ sequence: 0, sessionId: "session-b" });
    expect(frames[2]?.streamId).not.toBe(firstStreamId);

    sampler.disconnect();
    expect(sampler.sample()).toBeTrue();
    expect(frames[3]).toMatchObject({ sequence: 0, sessionId: "session-b" });
    expect(frames[3]?.streamId).not.toBe(frames[2]?.streamId);

    acceptsFrames = false;
    expect(sampler.sample()).toBeFalse();
    const rejectedStreamId = frames[4]?.streamId;
    acceptsFrames = true;
    expect(sampler.sample()).toBeTrue();
    expect(frames[5]).toMatchObject({ sequence: 0, sessionId: "session-b" });
    expect(frames[5]?.streamId).not.toBe(rejectedStreamId);
  });

  test("keeps one registered source per renderer and releases it with its owner", () => {
    const source: AudioFeatureSource = { readBands: () => null };
    const unregister = registerAudioFeatureSource(source);

    expect(getAudioFeatureSource()).toBe(source);
    expect(() => registerAudioFeatureSource({ readBands: () => null })).toThrow(
      "Only one audio feature source",
    );

    unregister();
    expect(getAudioFeatureSource()).toBeNull();
  });
});

function samplerPublish(frame: {
  authorityId: string;
  sequence: number;
  sessionId: string;
  spectrum: number[];
  streamId: string;
}) {
  return frame;
}
