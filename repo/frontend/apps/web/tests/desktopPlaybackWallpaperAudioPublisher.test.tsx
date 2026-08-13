import { describe, expect, test } from "bun:test";
import type { AudioFeatureFrameV1 } from "@scopifymusicplayer/desktop-contract";

import {
  createAudioFeaturePublisherConnection,
  shouldConnectAudioFeaturePublisher,
} from "@/lib/audioFeature/publisherConnection";
import type {
  AudioFeaturePublisherSampler,
  AudioFeaturePublisherTimer,
  AudioFeaturePublisherTransport,
} from "@/types/audioFeaturePublisher";

class ManualTimer implements AudioFeaturePublisherTimer {
  callback: (() => void) | null = null;
  cleared = 0;
  delayMs: number | null = null;

  clearTimeout(handle: unknown) {
    if (handle !== this) return;
    this.cleared += 1;
    this.callback = null;
  }

  fire() {
    const callback = this.callback;
    this.callback = null;
    callback?.();
  }

  setTimeout(callback: () => void, delayMs: number) {
    this.callback = callback;
    this.delayMs = delayMs;
    return this;
  }
}

function createHarness() {
  const closeCallbacks: Array<() => void> = [];
  const sampler: AudioFeaturePublisherSampler & {
    disconnects: number;
    starts: number;
    stops: number;
  } = {
    disconnect() {
      this.disconnects += 1;
    },
    disconnects: 0,
    start() {
      this.starts += 1;
    },
    starts: 0,
    stop() {
      this.stops += 1;
    },
    stops: 0,
  };
  const transport: AudioFeaturePublisherTransport & { unsubscribes: number } = {
    connect(
      role: "publisher",
      _connectionId: string,
      _onFrame: (frame: AudioFeatureFrameV1) => void,
      onClose: () => void,
    ) {
      expect(role).toBe("publisher");
      closeCallbacks.push(onClose);
      return () => {
        this.unsubscribes += 1;
      };
    },
    unsubscribes: 0,
  };
  const timer = new ManualTimer();
  return { closeCallbacks, sampler, timer, transport };
}

describe("audio feature publisher lifecycle", () => {
  test("selects the desktop Main Authority as the sole publisher", () => {
    expect(shouldConnectAudioFeaturePublisher(false)).toBeFalse();
    expect(shouldConnectAudioFeaturePublisher(true)).toBeTrue();
  });

  test("reconnects a passive close without interrupting the fixed-rate sampler", () => {
    const harness = createHarness();
    const connection = createAudioFeaturePublisherConnection({
      connectionId: "main-renderer-audio-feature-publisher",
      reconnectDelayMs: 1_000,
      sampler: harness.sampler,
      timer: harness.timer,
      transport: harness.transport,
    });

    connection.start();
    connection.start();
    expect(harness.sampler.starts).toBe(1);
    expect(harness.closeCallbacks).toHaveLength(1);

    harness.closeCallbacks[0]?.();
    expect(harness.sampler.disconnects).toBe(1);
    expect(harness.timer.delayMs).toBe(1_000);
    expect(harness.transport.unsubscribes).toBe(0);

    harness.timer.fire();
    expect(harness.closeCallbacks).toHaveLength(2);
    expect(harness.transport.unsubscribes).toBe(1);

    harness.closeCallbacks[0]?.();
    expect(harness.timer.callback).toBeNull();

    connection.dispose();
    expect(harness.sampler.stops).toBe(1);
    expect(harness.transport.unsubscribes).toBe(2);
    harness.closeCallbacks[1]?.();
    expect(harness.timer.callback).toBeNull();
  });
});
