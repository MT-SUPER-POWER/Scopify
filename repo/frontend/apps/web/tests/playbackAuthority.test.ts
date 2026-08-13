import { describe, expect, test } from "bun:test";
import type {
  PlaybackCommandReceipt,
  PlaybackMessage,
  PlaybackPhase,
  PlaybackProjection,
  PlaybackSessionState,
} from "@scopify/desktop-contract";

import { PlaybackAuthority } from "@/lib/playbackProjection/authority";
import { createInProcessPlaybackTransport } from "@/lib/playbackProjection/inProcessTransport";
import type {
  PlaybackAuthorityIdentityFactory,
  PlaybackAuthorityMediaEvent,
  PlaybackAuthorityScheduler,
  PlaybackMediaPort,
  PlaybackMediaSample,
} from "@/types/playbackAuthority";
import type { AdjustablePlaybackClock, PlaybackProjectionSource } from "@/types/playbackProjection";

class FakeClock implements AdjustablePlaybackClock {
  constructor(private now = 0) {}

  advanceBy(durationMs: number): number {
    this.now += durationMs;
    return this.now;
  }

  nowMs(): number {
    return this.now;
  }

  setNowMs(nowMs: number): void {
    this.now = nowMs;
  }
}

class FakeScheduler implements PlaybackAuthorityScheduler {
  private nextHandle = 1;
  private readonly tasks = new Map<
    number,
    { callback: () => void; intervalMs: number; nextRunMs: number }
  >();

  constructor(private readonly clock: FakeClock) {}

  clearInterval(handle: unknown): void {
    this.tasks.delete(handle as number);
  }

  setInterval(callback: () => void, intervalMs: number): unknown {
    const handle = this.nextHandle++;
    this.tasks.set(handle, {
      callback,
      intervalMs,
      nextRunMs: this.clock.nowMs() + intervalMs,
    });
    return handle;
  }

  advanceBy(durationMs: number): void {
    const targetMs = this.clock.nowMs() + durationMs;

    while (true) {
      const nextRunMs = Math.min(...[...this.tasks.values()].map((task) => task.nextRunMs));
      if (!Number.isFinite(nextRunMs) || nextRunMs > targetMs) break;

      this.clock.setNowMs(nextRunMs);
      for (const task of [...this.tasks.values()]) {
        if (task.nextRunMs !== nextRunMs) continue;
        task.nextRunMs += task.intervalMs;
        task.callback();
      }
    }

    this.clock.setNowMs(targetMs);
  }
}

class FakeMedia implements PlaybackMediaPort {
  readonly listeners = new Set<(event: PlaybackAuthorityMediaEvent) => void>();
  readonly operations: string[] = [];
  playError: Error | null = null;
  playGate: Promise<void> | null = null;
  sample: PlaybackMediaSample = {
    durationMs: 180_000,
    ended: false,
    errorMessage: null,
    paused: true,
    playbackRate: 1,
    positionMs: 0,
    volume: 50,
  };

  getSample(): PlaybackMediaSample {
    return { ...this.sample };
  }

  pause(): void {
    this.operations.push("pause");
    this.sample.paused = true;
  }

  async play(): Promise<void> {
    this.operations.push("play");
    if (this.playGate) await this.playGate;
    if (this.playError) throw this.playError;
    this.sample.paused = false;
  }

  seek(positionMs: number): void {
    this.operations.push(`seek:${positionMs}`);
    this.sample.positionMs = positionMs;
  }

  setVolume(volume: number): void {
    this.operations.push(`volume:${volume}`);
    this.sample.volume = volume;
  }

  subscribe(listener: (event: PlaybackAuthorityMediaEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: PlaybackAuthorityMediaEvent): void {
    for (const listener of [...this.listeners]) listener(event);
  }
}

function createIdentityFactory(): PlaybackAuthorityIdentityFactory {
  let authoritySequence = 0;
  let sessionSequence = 0;
  return {
    createAuthorityId: () => `authority-${++authoritySequence}`,
    createSessionId: () => `session-${++sessionSequence}`,
  };
}

function createState(overrides: Partial<PlaybackSessionState> = {}): PlaybackSessionState {
  return {
    canControl: true,
    durationMs: 180_000,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "paused",
    track: {
      artistNames: ["Artist"],
      id: 1,
      title: "Track",
    },
    volume: 50,
    ...overrides,
  };
}

function messagesOfType<TType extends PlaybackMessage["type"]>(
  messages: PlaybackMessage[],
  type: TType,
): Array<Extract<PlaybackMessage, { type: TType }>> {
  return messages.filter(
    (message): message is Extract<PlaybackMessage, { type: TType }> => message.type === type,
  );
}

function createFixture(
  overrides: {
    callbacks?: ConstructorParameters<typeof PlaybackAuthority>[0]["callbacks"];
    media?: FakeMedia;
  } = {},
) {
  const clock = new FakeClock();
  const scheduler = new FakeScheduler(clock);
  const media = overrides.media ?? new FakeMedia();
  const messages: PlaybackMessage[] = [];
  const authority = new PlaybackAuthority({
    callbacks: overrides.callbacks,
    clock,
    identityFactory: createIdentityFactory(),
    media,
    publish: (message) => messages.push(message),
    scheduler,
  });

  return { authority, clock, media, messages, scheduler };
}

describe("PlaybackAuthority lifecycle", () => {
  test("exposes a readonly identity for the active Authority session only", () => {
    const { authority } = createFixture();

    expect(authority.currentIdentity).toBeNull();
    authority.start(createState());
    expect(authority.currentIdentity).toEqual({
      authorityId: "authority-1",
      sessionId: "session-1",
    });
    expect(Object.isFrozen(authority.currentIdentity)).toBeTrue();

    authority.beginSession(createState(), { reason: "replay" });
    expect(authority.currentIdentity).toEqual({
      authorityId: "authority-1",
      sessionId: "session-2",
    });

    authority.stop();
    expect(authority.currentIdentity).toBeNull();
  });

  test("uses unique lifecycle/session identities and strictly increasing reliable sequence", () => {
    const { authority, media, messages, scheduler } = createFixture();
    authority.start(createState());

    media.sample.paused = false;
    media.emit("playing");
    scheduler.advanceBy(1_000);
    authority.beginSession(createState({ phase: "playing" }), {
      positionMs: 0,
      reason: "replay",
    });

    const firstLifecycleMessages = [...messages];
    expect(firstLifecycleMessages.map((message) => message.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(firstLifecycleMessages.map((message) => message.authorityId))).toEqual(
      new Set(["authority-1"]),
    );
    expect(firstLifecycleMessages[0].sessionId).toBe("session-1");
    expect(firstLifecycleMessages.at(-1)?.sessionId).toBe("session-2");
    expect(messagesOfType(messages, "timeline-discontinued")[0]).toMatchObject({
      anchor: { timelineRevision: 1 },
      reason: "replay",
    });

    authority.stop();
    const stoppedMessageCount = messages.length;
    scheduler.advanceBy(5_000);
    media.emit("playing");
    expect(messages).toHaveLength(stoppedMessageCount);

    authority.start(createState());
    const restartedBootstrap = messages.at(-1);
    expect(restartedBootstrap).toMatchObject({
      authorityId: "authority-2",
      sequence: 1,
      sessionId: "session-3",
      type: "bootstrap",
    });
  });

  test("publishes every explicit media phase and anchors phase clock changes", () => {
    const phases: PlaybackPhase[] = [];
    const { authority, media, messages } = createFixture({
      callbacks: { onPhaseChange: (phase) => phases.push(phase) },
    });
    authority.start(createState({ phase: "idle", track: null }));

    media.emit("load-start");
    media.sample.paused = false;
    media.emit("playing");
    media.emit("waiting");
    media.emit("can-play");
    media.sample.paused = true;
    media.emit("pause");
    media.sample.ended = true;
    media.emit("ended");
    media.sample.errorMessage = "decode failed";
    media.emit("error");

    expect(messagesOfType(messages, "state-changed").map((message) => message.state.phase)).toEqual(
      ["loading", "playing", "buffering", "playing", "paused", "ended", "error"],
    );
    expect(phases).toEqual([
      "loading",
      "playing",
      "buffering",
      "playing",
      "paused",
      "ended",
      "error",
    ]);
    expect(messagesOfType(messages, "clock-anchored")).toHaveLength(7);
  });

  test("notifies injected phase and volume callbacks without queue side effects", async () => {
    const phases: PlaybackPhase[] = [];
    const volumes: number[] = [];
    const { authority, media } = createFixture({
      callbacks: {
        onPhaseChange: (phase) => phases.push(phase),
        onVolumeChange: (volume) => volumes.push(volume),
      },
    });
    authority.start(createState());

    media.sample.paused = false;
    media.emit("playing");
    await authority.dispatch({ commandId: "volume", type: "set-volume", volume: 72 });

    expect(phases).toEqual(["playing"]);
    expect(volumes).toEqual([72]);
  });
});

describe("PlaybackAuthority clock and timeline", () => {
  test("samples the media port for injected 1Hz health anchors", () => {
    const { authority, media, messages, scheduler } = createFixture();
    media.sample.paused = false;
    media.sample.positionMs = 5_000;
    authority.start(createState({ phase: "playing" }));

    scheduler.advanceBy(999);
    expect(messagesOfType(messages, "clock-anchored")).toHaveLength(0);

    media.sample.positionMs = 6_250;
    scheduler.advanceBy(1);
    expect(messagesOfType(messages, "clock-anchored")).toEqual([
      expect.objectContaining({
        anchor: {
          positionMs: 6_250,
          rate: 1,
          sampledAtMs: 1_000,
          timelineRevision: 0,
        },
        sequence: 2,
      }),
    ]);
  });

  test("increments timeline revision only for explicit discontinuities", async () => {
    const { authority, media, messages, scheduler } = createFixture();
    media.sample.paused = false;
    media.sample.positionMs = 34_000;
    authority.start(createState({ phase: "playing" }));

    media.emit("waiting");
    scheduler.advanceBy(1_000);
    expect(
      messages.every((message) => {
        if (message.type === "state-changed") return message.timelineRevision === 0;
        if ("anchor" in message) return message.anchor.timelineRevision === 0;
        return true;
      }),
    ).toBeTrue();

    expect(
      await authority.dispatch({ commandId: "seek-back", positionMs: 10_000, type: "seek" }),
    ).toEqual({ commandId: "seek-back", status: "accepted" });
    expect(media.sample.positionMs).toBe(10_000);
    expect(messagesOfType(messages, "timeline-discontinued").at(-1)).toMatchObject({
      anchor: { positionMs: 10_000, timelineRevision: 1 },
      causedByCommandId: "seek-back",
      reason: "seek",
    });

    await authority.dispatch({ commandId: "seek-forward", positionMs: 90_000, type: "seek" });
    expect(messagesOfType(messages, "timeline-discontinued").at(-1)).toMatchObject({
      anchor: { positionMs: 90_000, timelineRevision: 2 },
      causedByCommandId: "seek-forward",
    });

    media.sample.paused = true;
    media.emit("pause");
    expect(messagesOfType(messages, "clock-anchored").at(-1)?.anchor.timelineRevision).toBe(2);
  });

  test("publishes a duration shrink as an explicit media correction", () => {
    const { authority, media, messages } = createFixture();
    media.sample.paused = false;
    media.sample.positionMs = 34_000;
    authority.start(createState({ phase: "playing" }));

    media.sample.durationMs = 32_000;
    media.emit("duration-change");

    expect(messages.slice(-2)).toEqual([
      expect.objectContaining({
        anchor: expect.objectContaining({ positionMs: 32_000, timelineRevision: 1 }),
        reason: "media-correction",
        type: "timeline-discontinued",
      }),
      expect.objectContaining({
        state: expect.objectContaining({ durationMs: 32_000 }),
        timelineRevision: 1,
        type: "state-changed",
      }),
    ]);
  });
});

describe("PlaybackAuthority commands", () => {
  test("returns to a paused phase when the media host rejects play", async () => {
    const clock = new FakeClock(1_000);
    const scheduler = new FakeScheduler(clock);
    const media = new FakeMedia();
    const messages: PlaybackMessage[] = [];
    const authority = new PlaybackAuthority({
      clock,
      media,
      publish: (message) => messages.push(message),
      scheduler,
    });
    authority.start(createState());
    media.playError = new Error("autoplay denied");

    await expect(authority.dispatch({ commandId: "play-denied", type: "play" })).resolves.toEqual({
      commandId: "play-denied",
      reason: "command-execution-failed",
      status: "rejected",
    });
    expect(messages.at(-1)).toMatchObject({ state: { phase: "paused" }, type: "bootstrap" });
  });

  test("executes commands serially and returns accepted receipts", async () => {
    let releaseNext: (() => void) | undefined;
    const nextGate = new Promise<void>((resolve) => {
      releaseNext = resolve;
    });
    const { authority, media } = createFixture({
      callbacks: {
        next: () => nextGate,
        toggleLike: () => true,
      },
    });
    authority.start(createState());

    const nextReceipt = authority.dispatch({ commandId: "next", type: "next" });
    const volumeReceipt = authority.dispatch({
      commandId: "volume",
      type: "set-volume",
      volume: 80,
    });
    await Promise.resolve();
    expect(media.sample.volume).toBe(50);

    releaseNext?.();
    expect(await nextReceipt).toEqual({ commandId: "next", status: "accepted" });
    expect(await volumeReceipt).toEqual({ commandId: "volume", status: "accepted" });
    expect(media.sample.volume).toBe(80);
    expect(await authority.dispatch({ commandId: "like", type: "toggle-like" })).toEqual({
      commandId: "like",
      status: "accepted",
    });
  });

  test("does not let an old Session play completion mutate the new Session", async () => {
    let releasePlay: (() => void) | undefined;
    const media = new FakeMedia();
    media.playGate = new Promise<void>((resolve) => {
      releasePlay = resolve;
    });
    const { authority, messages } = createFixture({ media });
    authority.start(createState());

    const oldPlay = authority.dispatch({ commandId: "old-play", type: "play" });
    await Promise.resolve();
    authority.beginSession(
      createState({
        durationMs: 90_000,
        track: { artistNames: ["Next"], id: 2, title: "Next track" },
      }),
      { reason: "track-change" },
    );
    releasePlay?.();

    expect(await oldPlay).toEqual({
      commandId: "old-play",
      reason: "command-superseded",
      status: "unavailable",
    });
    const nextSessionId = messages.at(-1)?.sessionId;
    expect(
      messages.some(
        (message) =>
          message.sessionId === nextSessionId &&
          message.type === "state-changed" &&
          message.state.phase === "playing",
      ),
    ).toBeFalse();
  });

  test("keeps the next track duration independent from the previous media source", () => {
    const { authority, media, messages } = createFixture();
    authority.start(createState({ durationMs: 180_000 }));
    media.sample.durationMs = 240_000;

    authority.beginSession(createState({ durationMs: 90_000 }), {
      reason: "track-change",
    });

    const nextBootstrap = messagesOfType(messages, "bootstrap").at(-1);
    expect(nextBootstrap?.state.durationMs).toBe(90_000);
    expect(media.operations).toContain("pause");
  });

  test("does not call media play when the source cannot be prepared", async () => {
    const { authority, media } = createFixture({
      callbacks: { ensureSource: () => false },
    });
    authority.start(createState());

    expect(await authority.dispatch({ commandId: "missing-source", type: "play" })).toEqual({
      commandId: "missing-source",
      reason: "playback-source-unavailable",
      status: "unavailable",
    });
    expect(media.operations).not.toContain("play");
  });

  test("deduplicates command IDs and rejects invalid input without touching media", async () => {
    let nextCalls = 0;
    const { authority, media } = createFixture({
      callbacks: { next: () => void nextCalls++ },
    });
    authority.start(createState());

    const first = authority.dispatch({ commandId: "same-command", type: "next" });
    const duplicate = authority.dispatch({ commandId: "same-command", type: "next" });
    expect(first).toBe(duplicate);
    await first;
    expect(nextCalls).toBe(1);

    expect(
      await authority.dispatch({ commandId: "bad-volume", type: "set-volume", volume: 200 }),
    ).toEqual({ commandId: "bad-volume", reason: "invalid-volume", status: "rejected" });
    expect(media.sample.volume).toBe(50);

    authority.stop();
    expect(await authority.dispatch({ commandId: "stopped", type: "play" })).toEqual({
      commandId: "stopped",
      reason: "authority-not-available",
      status: "unavailable",
    });
  });
});

describe("in-process playback transport", () => {
  test("routes reliable messages and commands through the ProjectionSource seam", async () => {
    const transport = createInProcessPlaybackTransport();
    const received: PlaybackMessage[] = [];
    const projection: PlaybackProjection = {
      ...createState(),
      authorityId: null,
      connection: "connected",
      isPlaying: false,
      positionMs: 0,
      sessionId: null,
    };
    const source: PlaybackProjectionSource = {
      dispatch: async (command): Promise<PlaybackCommandReceipt> => ({
        commandId: command.commandId,
        status: "unavailable",
      }),
      getSnapshot: () => projection,
      subscribe: () => () => undefined,
    };
    const connection = transport.connectProjection(source, (message) => received.push(message));

    expect(await connection.dispatch({ commandId: "before-authority", type: "play" })).toEqual({
      commandId: "before-authority",
      reason: "authority-disconnected",
      status: "unavailable",
    });

    const clock = new FakeClock();
    const scheduler = new FakeScheduler(clock);
    const media = new FakeMedia();
    const authority = new PlaybackAuthority({
      clock,
      identityFactory: createIdentityFactory(),
      media,
      publish: transport.publish,
      scheduler,
    });
    const disconnectAuthority = transport.connectAuthority({
      dispatch: (command) => authority.dispatch(command),
      requestBootstrap: () => authority.publishBootstrap(),
    });
    authority.start(createState());

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe("bootstrap");
    expect(connection.getSnapshot()).toBe(projection);
    expect(await connection.dispatch({ commandId: "play", type: "play" })).toEqual({
      commandId: "play",
      status: "accepted",
    });

    connection.disconnect();
    const receivedBeforeDisconnect = received.length;
    scheduler.advanceBy(1_000);
    expect(received).toHaveLength(receivedBeforeDisconnect);
    expect(await connection.dispatch({ commandId: "after-disconnect", type: "pause" })).toEqual({
      commandId: "after-disconnect",
      reason: "projection-disconnected",
      status: "unavailable",
    });

    disconnectAuthority();
    authority.stop();
  });
});
