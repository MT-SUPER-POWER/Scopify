import { describe, expect, test } from "bun:test";

import type { AudioFeatureAck, AudioFeatureFrameV1 } from "@scopifymusicplayer/desktop-contract";

import {
  createAudioFeatureBroker,
  createOwnedAudioFeatureConnectionId,
  parseAudioFeatureConnectionRequest,
  type AudioFeatureBrokerPort,
  type AudioFeatureBrokerScheduler,
} from "@/main/module/audioFeatureBroker";

class MemoryAudioFeaturePort implements AudioFeatureBrokerPort {
  readonly posted: unknown[] = [];
  closed = false;

  private readonly closeListeners = new Set<() => void>();
  private readonly messageListeners = new Set<(message: unknown) => void>();

  close() {
    this.closed = true;
  }

  onClose(listener: () => void) {
    this.closeListeners.add(listener);
    return () => this.closeListeners.delete(listener);
  }

  onMessage(listener: (message: unknown) => void) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  postMessage(message: unknown) {
    if (this.closed) throw new Error("memory audio-feature port closed");
    this.posted.push(structuredClone(message));
  }

  receive(message: unknown) {
    for (const listener of [...this.messageListeners]) listener(structuredClone(message));
  }

  remoteClose() {
    if (this.closed) return;
    this.closed = true;
    for (const listener of [...this.closeListeners]) listener();
  }
}

class ManualScheduler implements AudioFeatureBrokerScheduler {
  now = 0;
  private readonly jobs = new Set<{ cancelled: boolean; dueAt: number; callback: () => void }>();

  clearTimeout(timeout: unknown) {
    (timeout as { cancelled: boolean }).cancelled = true;
  }

  setTimeout(callback: () => void, delayMs: number) {
    const job = { callback, cancelled: false, dueAt: this.now + delayMs };
    this.jobs.add(job);
    return job;
  }

  advanceBy(ms: number) {
    this.now += ms;
    for (const job of [...this.jobs]) {
      if (job.cancelled || job.dueAt > this.now) continue;
      this.jobs.delete(job);
      job.callback();
    }
  }
}

function createFrame(
  sequence: number,
  overrides: Partial<AudioFeatureFrameV1> = {},
): AudioFeatureFrameV1 {
  return {
    authorityId: "authority-a",
    bass: 1,
    lowMid: 2,
    mid: 3,
    power: 4,
    protocolVersion: 1,
    sampledAtMs: 1_000 + sequence,
    sequence,
    sessionId: "session-a",
    spectrum: [5, 6],
    streamId: "stream-a",
    treble: 7,
    type: "audio-feature-frame",
    vocal: 8,
    ...overrides,
  };
}

function acknowledge(frame: AudioFeatureFrameV1): AudioFeatureAck {
  return { sequence: frame.sequence, streamId: frame.streamId, type: "audio-feature-ack" };
}

describe("AudioFeatureBroker", () => {
  test("sends the first frame immediately and clears its gate only after the matching ACK", () => {
    const broker = createAudioFeatureBroker();
    const publisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    const frame = createFrame(0);
    publisher.receive(frame);
    expect(subscriber.posted).toEqual([frame]);
    expect(broker.getDiagnostics().subscribers).toEqual([
      expect.objectContaining({ inFlightSequence: 0, pendingLatestSequence: null }),
    ]);

    subscriber.receive(acknowledge(frame));
    expect(broker.getDiagnostics()).toMatchObject({
      acksAccepted: 1,
      subscribers: [expect.objectContaining({ inFlightSequence: null })],
    });
  });

  test("keeps only the newest pending frame while an ACK is outstanding", () => {
    const broker = createAudioFeatureBroker();
    const publisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    const first = createFrame(0);
    const second = createFrame(1);
    const third = createFrame(2);
    publisher.receive(first);
    publisher.receive(second);
    publisher.receive(third);
    expect(subscriber.posted).toEqual([first]);
    expect(broker.getDiagnostics()).toMatchObject({
      pendingOverwrites: 1,
      subscribers: [expect.objectContaining({ pendingLatestSequence: 2 })],
    });

    subscriber.receive(acknowledge(first));
    expect(subscriber.posted).toEqual([first, third]);
    expect(broker.getDiagnostics().subscribers).toEqual([
      expect.objectContaining({ inFlightSequence: 2, pendingLatestSequence: null }),
    ]);
  });

  test("gates each subscriber independently", () => {
    const broker = createAudioFeatureBroker();
    const publisher = new MemoryAudioFeaturePort();
    const fastSubscriber = new MemoryAudioFeaturePort();
    const slowSubscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("fast", fastSubscriber);
    broker.registerSubscriber("slow", slowSubscriber);

    const first = createFrame(0);
    const second = createFrame(1);
    publisher.receive(first);
    fastSubscriber.receive(acknowledge(first));
    publisher.receive(second);
    expect(fastSubscriber.posted).toEqual([first, second]);
    expect(slowSubscriber.posted).toEqual([first]);

    slowSubscriber.receive(acknowledge(first));
    expect(slowSubscriber.posted).toEqual([first, second]);
  });

  test("does not release a gate for a mismatched ACK", () => {
    const broker = createAudioFeatureBroker();
    const publisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    const first = createFrame(0);
    const second = createFrame(1);
    publisher.receive(first);
    publisher.receive(second);
    subscriber.receive({ ...acknowledge(first), sequence: 99 });
    expect(subscriber.posted).toEqual([first]);
    expect(broker.getDiagnostics()).toMatchObject({
      lastRejection: { reason: "ack-mismatch", source: "subscriber" },
      subscribers: [expect.objectContaining({ inFlightSequence: 0, pendingLatestSequence: 1 })],
    });

    subscriber.receive(acknowledge(first));
    expect(subscriber.posted).toEqual([first, second]);
  });

  test("rejects malformed and wrong-direction transport payloads", () => {
    const broker = createAudioFeatureBroker();
    const publisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    publisher.receive({ ...createFrame(0), spectrum: Array(257).fill(0) });
    publisher.receive(acknowledge(createFrame(0)));
    subscriber.receive(createFrame(0));
    subscriber.receive({ type: "audio-feature-ack", streamId: "stream-a", sequence: -1 });

    expect(subscriber.posted).toEqual([]);
    expect(broker.getDiagnostics()).toMatchObject({ framesAccepted: 0, framesRejected: 1 });
    expect(broker.getDiagnostics().lastRejection).toMatchObject({
      reason: "invalid-ack",
      source: "subscriber",
    });
  });

  test("counts ACK timeouts without retrying or opening another queue slot", () => {
    const scheduler = new ManualScheduler();
    const broker = createAudioFeatureBroker({ ackTimeoutMs: 10, scheduler });
    const publisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    const first = createFrame(0);
    const latest = createFrame(1);
    publisher.receive(first);
    publisher.receive(latest);
    scheduler.advanceBy(10);
    scheduler.advanceBy(100);
    expect(subscriber.posted).toEqual([first]);
    expect(broker.getDiagnostics()).toMatchObject({
      ackTimeouts: 1,
      subscribers: [expect.objectContaining({ inFlightSequence: 0, pendingLatestSequence: 1 })],
    });
  });

  test("clears every subscriber gate when a publisher is replaced", () => {
    const broker = createAudioFeatureBroker();
    const firstPublisher = new MemoryAudioFeaturePort();
    const replacementPublisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", firstPublisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    firstPublisher.receive(createFrame(0, { streamId: "old-stream" }));
    firstPublisher.receive(createFrame(1, { streamId: "old-stream" }));
    broker.registerPublisher("publisher-b", replacementPublisher);
    const replacement = createFrame(0, { streamId: "new-stream" });
    replacementPublisher.receive(replacement);

    expect(firstPublisher.closed).toBeTrue();
    expect(subscriber.posted).toEqual([createFrame(0, { streamId: "old-stream" }), replacement]);
    expect(broker.getDiagnostics()).toMatchObject({ publisherReplacements: 1 });
  });

  test("delivers a replacement publisher's first frame immediately after the prior publisher closes", () => {
    const broker = createAudioFeatureBroker();
    const firstPublisher = new MemoryAudioFeaturePort();
    const replacementPublisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", firstPublisher);
    broker.registerSubscriber("subscriber-a", subscriber);

    firstPublisher.receive(createFrame(0, { streamId: "old-stream" }));
    firstPublisher.receive(createFrame(1, { streamId: "old-stream" }));
    firstPublisher.remoteClose();
    broker.registerPublisher("publisher-b", replacementPublisher);
    const replacement = createFrame(0, { streamId: "new-stream" });
    replacementPublisher.receive(replacement);

    expect(subscriber.posted).toEqual([createFrame(0, { streamId: "old-stream" }), replacement]);
    expect(broker.getDiagnostics()).toMatchObject({
      publisherDisconnects: 1,
      subscribers: [expect.objectContaining({ inFlightStreamId: "new-stream" })],
    });
  });

  test("clones frame input, isolates a closed subscriber, and disposes idempotently", () => {
    const broker = createAudioFeatureBroker();
    const publisher = new MemoryAudioFeaturePort();
    const subscriber = new MemoryAudioFeaturePort();
    const otherSubscriber = new MemoryAudioFeaturePort();
    broker.registerPublisher("publisher-a", publisher);
    broker.registerSubscriber("subscriber-a", subscriber);
    broker.registerSubscriber("other", otherSubscriber);

    const first = createFrame(0);
    const pending = createFrame(1, { bass: 55 });
    publisher.receive(first);
    publisher.receive(pending);
    pending.bass = 99;
    subscriber.remoteClose();
    otherSubscriber.receive(acknowledge(first));
    expect(otherSubscriber.posted.at(-1)).toEqual(createFrame(1, { bass: 55 }));
    expect(broker.getDiagnostics()).toMatchObject({ subscriberCount: 1, subscriberDisconnects: 1 });

    broker.dispose();
    broker.dispose();
    expect(publisher.closed).toBeTrue();
    expect(otherSubscriber.closed).toBeTrue();
    expect(broker.getDiagnostics()).toMatchObject({ disposed: true, subscriberCount: 0 });
  });
});

describe("audio feature connection requests", () => {
  test("accepts only bounded publisher/subscriber requests and owns IDs from sender identity", () => {
    expect(
      parseAudioFeatureConnectionRequest({ connectionId: "renderer-debug-id", role: "publisher" }),
    ).toEqual({ connectionId: "renderer-debug-id", role: "publisher" });
    expect(parseAudioFeatureConnectionRequest({ connectionId: "x", role: "authority" })).toBeNull();
    expect(parseAudioFeatureConnectionRequest({ connectionId: "", role: "subscriber" })).toBeNull();
    expect(createOwnedAudioFeatureConnectionId("publisher", 42)).toBe("publisher:42");
    expect(() => createOwnedAudioFeatureConnectionId("subscriber", -1)).toThrow(RangeError);
  });
});
