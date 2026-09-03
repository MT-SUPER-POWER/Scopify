import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_PROTOCOL_VERSION,
  type PlaybackBootstrap,
  type PlaybackClockAnchored,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
} from "@scopify/desktop-contract";

import { createPlaybackBroker, type PlaybackBrokerPort } from "@/main/capabilities/playbackBroker";

class MemoryPlaybackPort implements PlaybackBrokerPort {
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
    if (this.closed) throw new Error("memory port closed");
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

function createBootstrap(
  authorityId = "authority-a",
  sequence = 1,
  sessionId = "session-a",
  positionMs = 34_000,
): PlaybackBootstrap<string[]> {
  return {
    anchor: {
      positionMs,
      rate: 1,
      sampledAtMs: 1_000,
      timelineRevision: 0,
    },
    authorityId,
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence,
    sessionId,
    state: {
      canControl: true,
      durationMs: 180_000,
      liked: false,
      lyrics: ["line one", "line two"],
      lyricsVersion: 1,
      phase: "playing",
      track: {
        artistNames: ["Scopify"],
        id: 42,
        title: "Broker",
      },
      volume: 80,
    },
    type: "bootstrap",
  };
}

function createAnchor(
  sequence: number,
  overrides: Partial<PlaybackClockAnchored> = {},
): PlaybackClockAnchored {
  return {
    anchor: {
      positionMs: 35_000,
      rate: 1,
      sampledAtMs: 2_000,
      timelineRevision: 0,
    },
    authorityId: "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence,
    sessionId: "session-a",
    type: "clock-anchored",
    ...overrides,
  };
}

describe("Electron playback broker", () => {
  test("replays one immutable atomic bootstrap to a late replica", () => {
    const broker = createPlaybackBroker<string[]>();
    const authority = new MemoryPlaybackPort();
    const earlyReplica = new MemoryPlaybackPort();
    const lateReplica = new MemoryPlaybackPort();
    broker.registerAuthority("authority-a", authority);
    broker.registerReplica("early", earlyReplica);

    const bootstrap = createBootstrap();
    authority.receive(bootstrap);
    bootstrap.anchor.positionMs = 99_000;
    bootstrap.state.lyrics?.push("mutated after publish");

    broker.registerReplica("late", lateReplica);

    expect(earlyReplica.posted).toEqual([createBootstrap()]);
    expect(lateReplica.posted).toEqual([createBootstrap()]);
    expect(broker.getDiagnostics()).toMatchObject({
      acceptedMessages: 1,
      bootstrapReplays: 1,
      bootstrapSequence: 1,
      replicaCount: 2,
    });
  });

  test("synthesizes a late-join bootstrap from the latest reliable state and anchor", () => {
    const broker = createPlaybackBroker<string[]>();
    const authority = new MemoryPlaybackPort();
    const lateReplica = new MemoryPlaybackPort();
    broker.registerAuthority("main-renderer-connection", authority);

    const bootstrap = createBootstrap("authority-runtime-id", 1);
    authority.receive(bootstrap);
    authority.receive({
      ...bootstrap,
      sampledAtMs: 2_000,
      sequence: 2,
      state: { ...bootstrap.state, liked: true, volume: 65 },
      timelineRevision: 0,
      type: "state-changed",
    });
    authority.receive(
      createAnchor(3, {
        anchor: {
          positionMs: 41_000,
          rate: 1,
          sampledAtMs: 3_000,
          timelineRevision: 0,
        },
        authorityId: "authority-runtime-id",
      }),
    );

    broker.registerReplica("late", lateReplica);

    expect(lateReplica.posted).toEqual([
      {
        ...bootstrap,
        anchor: {
          positionMs: 41_000,
          rate: 1,
          sampledAtMs: 3_000,
          timelineRevision: 0,
        },
        sequence: 3,
        state: { ...bootstrap.state, liked: true, volume: 65 },
      },
    ]);
    expect(broker.getDiagnostics()).toMatchObject({
      activeAuthorityId: "authority-runtime-id",
      authorityConnectionId: "main-renderer-connection",
      bootstrapSequence: 3,
    });
  });

  test("routes commands and receipts only between their originating replica and authority", () => {
    const broker = createPlaybackBroker();
    const authority = new MemoryPlaybackPort();
    const firstReplica = new MemoryPlaybackPort();
    const secondReplica = new MemoryPlaybackPort();
    broker.registerAuthority("authority-a", authority);
    broker.registerReplica("first", firstReplica);
    broker.registerReplica("second", secondReplica);

    const command = {
      commandId: "seek-1",
      positionMs: 10_000,
      type: "seek",
    } satisfies PlaybackCommand;
    firstReplica.receive(command);

    expect(authority.posted).toEqual([{ type: "request-bootstrap" }, command]);
    expect(secondReplica.posted).toEqual([]);
    expect(broker.getDiagnostics().pendingCommandCount).toBe(1);

    const receipt = { commandId: "seek-1", status: "accepted" } satisfies PlaybackCommandReceipt;
    authority.receive(receipt);
    authority.receive(receipt);

    expect(firstReplica.posted).toEqual([receipt]);
    expect(secondReplica.posted).toEqual([]);
    expect(broker.getDiagnostics()).toMatchObject({
      commandReceiptsRouted: 1,
      commandsForwarded: 1,
      pendingCommandCount: 0,
    });

    firstReplica.receive(command);
    firstReplica.receive({ commandId: "invalid-seek", positionMs: -1, type: "seek" });

    expect(authority.posted).toEqual([{ type: "request-bootstrap" }, command]);
    expect(firstReplica.posted.at(-1)).toEqual({
      commandId: "seek-1",
      reason: "duplicate-command-id",
      status: "rejected",
    });
    expect(broker.getDiagnostics().rejectionCounts).toMatchObject({
      "duplicate-command-id": 1,
      "invalid-command": 1,
      "unknown-command-receipt": 1,
    });

    authority.remoteClose();
    secondReplica.receive({ commandId: "play-without-authority", type: "play" });
    expect(secondReplica.posted).toEqual([
      {
        commandId: "play-without-authority",
        reason: "playback-authority-unavailable",
        status: "unavailable",
      },
    ]);
  });

  test("atomically replaces authority lifecycle and resets ordering and replay state", () => {
    const broker = createPlaybackBroker();
    const firstAuthority = new MemoryPlaybackPort();
    const secondAuthority = new MemoryPlaybackPort();
    const replica = new MemoryPlaybackPort();
    const lateReplica = new MemoryPlaybackPort();
    const releaseFirst = broker.registerAuthority("authority-a", firstAuthority);
    broker.registerReplica("replica", replica);
    firstAuthority.receive(createBootstrap("authority-a", 7, "session-a"));
    replica.receive({ commandId: "pending", type: "next" } satisfies PlaybackCommand);

    broker.registerAuthority("authority-b", secondAuthority);
    broker.registerReplica("late", lateReplica);
    releaseFirst();

    expect(firstAuthority.closed).toBeTrue();
    expect(replica.posted.at(-1)).toEqual({
      commandId: "pending",
      reason: "playback-authority-replaced",
      status: "unavailable",
    });
    expect(lateReplica.posted).toEqual([]);
    expect(broker.getDiagnostics()).toMatchObject({
      activeAuthorityId: null,
      authorityConnectionId: "authority-b",
      authorityReplacements: 1,
      bootstrapSequence: null,
      lastSequence: null,
    });

    const replacementBootstrap = createBootstrap("authority-b", 0, "session-b", 0);
    secondAuthority.receive(replacementBootstrap);

    expect(replica.posted.at(-1)).toEqual(replacementBootstrap);
    expect(lateReplica.posted).toEqual([replacementBootstrap]);
    expect(broker.getDiagnostics()).toMatchObject({
      activeAuthorityId: "authority-b",
      activeSessionId: "session-b",
      authorityConnectionId: "authority-b",
      bootstrapSequence: 0,
      lastSequence: 0,
    });
  });

  test("requests a missing Bootstrap and bounds pending command lifetime", async () => {
    const broker = createPlaybackBroker({ commandReceiptTimeoutMs: 5 });
    const authority = new MemoryPlaybackPort();
    const replica = new MemoryPlaybackPort();
    broker.registerAuthority("authority", authority);
    broker.registerReplica("replica", replica);

    expect(authority.posted).toEqual([{ type: "request-bootstrap" }]);
    authority.receive(createBootstrap());
    replica.receive({ commandId: "slow-command", type: "next" } satisfies PlaybackCommand);
    expect(broker.getDiagnostics().pendingCommandCount).toBe(1);

    await Bun.sleep(15);

    expect(replica.posted.at(-1)).toEqual({
      commandId: "slow-command",
      reason: "command-receipt-timeout",
      status: "unavailable",
    });
    expect(broker.getDiagnostics().pendingCommandCount).toBe(0);

    authority.receive({ commandId: "slow-command", status: "accepted" });
    expect(broker.getDiagnostics().rejectionCounts["unknown-command-receipt"]).toBe(1);
    broker.dispose();
  });

  test("cleans up remotely closed ports, pending commands, and all registrations on disposal", () => {
    const broker = createPlaybackBroker();
    const authority = new MemoryPlaybackPort();
    const closedReplica = new MemoryPlaybackPort();
    const remainingReplica = new MemoryPlaybackPort();
    broker.registerAuthority("authority-a", authority);
    broker.registerReplica("closed", closedReplica);
    broker.registerReplica("remaining", remainingReplica);

    closedReplica.remoteClose();
    authority.receive(createBootstrap());
    remainingReplica.receive({ commandId: "next-1", type: "next" } satisfies PlaybackCommand);
    authority.remoteClose();

    expect(closedReplica.posted).toEqual([]);
    expect(remainingReplica.posted.at(-1)).toEqual({
      commandId: "next-1",
      reason: "playback-authority-disconnected",
      status: "unavailable",
    });
    expect(broker.getDiagnostics()).toMatchObject({
      activeAuthorityId: null,
      authorityDisconnects: 1,
      bootstrapSequence: null,
      pendingCommandCount: 0,
      replicaCount: 1,
      replicaDisconnects: 1,
    });

    broker.dispose();
    broker.dispose();

    expect(remainingReplica.closed).toBeTrue();
    expect(broker.getDiagnostics()).toMatchObject({ disposed: true, replicaCount: 0 });
    expect(() => broker.registerReplica("too-late", new MemoryPlaybackPort())).toThrow("disposed");
  });

  test("rejects malformed, duplicate, stale, foreign-authority, and cross-session messages", () => {
    const broker = createPlaybackBroker();
    const authority = new MemoryPlaybackPort();
    const replica = new MemoryPlaybackPort();
    broker.registerAuthority("authority-a", authority);
    broker.registerReplica("replica", replica);

    authority.receive(createAnchor(10));
    const bootstrap = createBootstrap("authority-a", 3);
    authority.receive(bootstrap);
    authority.receive(bootstrap);
    authority.receive(createAnchor(2));
    authority.receive(createBootstrap("not-the-authority", 4));
    authority.receive({ protocolVersion: PLAYBACK_PROTOCOL_VERSION, type: "clock-anchored" });
    authority.receive(createAnchor(4, { sessionId: "session-b" }));
    const acceptedAnchor = createAnchor(4);
    authority.receive(acceptedAnchor);

    expect(replica.posted).toEqual([bootstrap, acceptedAnchor]);
    expect(broker.getDiagnostics().rejectionCounts).toMatchObject({
      "authority-id-mismatch": 1,
      "bootstrap-required": 1,
      "invalid-authority-payload": 1,
      "session-bootstrap-required": 1,
      "stale-sequence": 2,
    });
    expect(broker.getDiagnostics()).toMatchObject({
      acceptedMessages: 2,
      lastSequence: 4,
      messageDeliveries: 2,
    });
  });

  test("forwards backward anchors verbatim without interpreting playback state or clock", () => {
    const broker = createPlaybackBroker();
    const authority = new MemoryPlaybackPort();
    const replica = new MemoryPlaybackPort();
    const lateReplica = new MemoryPlaybackPort();
    broker.registerAuthority("authority-a", authority);
    broker.registerReplica("replica", replica);

    const bootstrap = createBootstrap();
    bootstrap.anchor.timelineRevision = 4;
    const delayedBackwardAnchor = createAnchor(2, {
      anchor: {
        positionMs: 32_000,
        rate: 0.75,
        sampledAtMs: 5_000,
        timelineRevision: 4,
      },
    });
    authority.receive(bootstrap);
    authority.receive(delayedBackwardAnchor);
    broker.registerReplica("late", lateReplica);

    expect(replica.posted).toEqual([bootstrap, delayedBackwardAnchor]);
    expect(lateReplica.posted).toEqual([
      {
        ...bootstrap,
        anchor: delayedBackwardAnchor.anchor,
        sequence: delayedBackwardAnchor.sequence,
      },
    ]);
    expect(broker.getDiagnostics().lastRejection).toBeNull();
  });
});
