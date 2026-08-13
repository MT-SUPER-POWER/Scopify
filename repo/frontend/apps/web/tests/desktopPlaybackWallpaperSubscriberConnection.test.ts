import type { AudioFeatureFrameV1 } from "@mt-super-power/desktop-contract";
import { describe, expect, test } from "bun:test";

import {
  AUDIO_FEATURE_SUBSCRIBER_RECONNECT_DELAY_MS,
  createAudioFeatureSubscriberConnection,
} from "@/lib/desktopPlaybackWallpaper/subscriberConnection";
import type { RuntimeAudioFeature } from "@/lib/runtime";

interface FakeSubscriberAttempt {
  closed: boolean;
  onClose: () => void;
  onFrame: (frame: AudioFeatureFrameV1) => void;
  role: string;
}

class FakeAudioFeaturePort implements Pick<RuntimeAudioFeature, "connect"> {
  readonly attempts: FakeSubscriberAttempt[] = [];

  connect(
    role: "publisher" | "subscriber",
    _connectionId: string,
    onFrame: (frame: AudioFeatureFrameV1) => void,
    onClose: () => void,
  ) {
    const attempt = { closed: false, onClose, onFrame, role };
    this.attempts.push(attempt);
    return () => {
      attempt.closed = true;
    };
  }

  close(index: number): void {
    this.attempts[index]?.onClose();
  }

  deliver(index: number, frame: AudioFeatureFrameV1): void {
    this.attempts[index]?.onFrame(frame);
  }
}

class ManualTimer {
  readonly delays: number[] = [];
  private readonly callbacks = new Map<ReturnType<typeof setTimeout>, () => void>();
  private nextHandle = 0;

  clearTimeout(handle: ReturnType<typeof setTimeout>): void {
    this.callbacks.delete(handle);
  }

  runNext(): void {
    const next = this.callbacks.entries().next().value;
    if (!next) return;
    const [handle, callback] = next;
    this.callbacks.delete(handle);
    callback();
  }

  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> {
    this.nextHandle += 1;
    this.delays.push(delayMs);
    const handle = this.nextHandle as unknown as ReturnType<typeof setTimeout>;
    this.callbacks.set(handle, callback);
    return handle;
  }
}

function createFrame(overrides: Partial<AudioFeatureFrameV1> = {}): AudioFeatureFrameV1 {
  return {
    authorityId: "authority-a",
    bass: 0,
    lowMid: 0,
    mid: 0,
    power: 0,
    protocolVersion: 1,
    sampledAtMs: 0,
    sequence: 0,
    sessionId: "session-a",
    spectrum: [],
    streamId: "stream-a",
    treble: 0,
    type: "audio-feature-frame",
    vocal: 0,
    ...overrides,
  };
}

describe("Wallpaper audio feature subscriber connection", () => {
  test("reconnects one second after a port close and forwards only the current generation", () => {
    const port = new FakeAudioFeaturePort();
    const timer = new ManualTimer();
    const frames: AudioFeatureFrameV1[] = [];
    const subscriber = createAudioFeatureSubscriberConnection({
      connectionId: "wallpaper-a",
      onFrame: (frame) => frames.push(frame),
      port,
      timer,
    });

    subscriber.start();
    expect(port.attempts).toHaveLength(1);
    expect(port.attempts[0]?.role).toBe("subscriber");

    port.deliver(0, createFrame());
    port.close(0);
    port.close(0);
    expect(frames).toHaveLength(1);
    expect(timer.delays).toEqual([AUDIO_FEATURE_SUBSCRIBER_RECONNECT_DELAY_MS]);
    expect(port.attempts[0]?.closed).toBeTrue();
    expect(port.attempts).toHaveLength(1);

    timer.runNext();
    expect(port.attempts).toHaveLength(2);
    port.deliver(0, createFrame({ streamId: "delayed-stream", sequence: 1 }));
    port.deliver(1, createFrame({ streamId: "reconnected-stream", sequence: 0 }));
    expect(frames.map((frame) => frame.streamId)).toEqual(["stream-a", "reconnected-stream"]);
  });

  test("cancels a pending reconnect and rejects late callbacks after stop", () => {
    const port = new FakeAudioFeaturePort();
    const timer = new ManualTimer();
    const frames: AudioFeatureFrameV1[] = [];
    const subscriber = createAudioFeatureSubscriberConnection({
      connectionId: "wallpaper-a",
      onFrame: (frame) => frames.push(frame),
      port,
      timer,
    });

    subscriber.start();
    port.close(0);
    subscriber.stop();
    timer.runNext();
    port.deliver(0, createFrame());
    port.close(0);

    expect(port.attempts).toHaveLength(1);
    expect(frames).toEqual([]);
  });

  test("does not let an old close callback schedule a second reconnect after restart", () => {
    const port = new FakeAudioFeaturePort();
    const timer = new ManualTimer();
    const subscriber = createAudioFeatureSubscriberConnection({
      connectionId: "wallpaper-a",
      onFrame: () => undefined,
      port,
      timer,
    });

    subscriber.start();
    subscriber.start();
    expect(port.attempts).toHaveLength(2);
    port.close(0);
    expect(timer.delays).toEqual([]);

    port.close(1);
    expect(timer.delays).toEqual([AUDIO_FEATURE_SUBSCRIBER_RECONNECT_DELAY_MS]);
    timer.runNext();
    expect(port.attempts).toHaveLength(3);
  });
});
