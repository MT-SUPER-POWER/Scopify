import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_PROTOCOL_VERSION,
  type PlaybackBootstrap,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
} from "@scopify/desktop-contract";

import { createPlaybackBroker, type PlaybackBrokerPort } from "@main/capabilities/playbackBroker";
import { createPlaybackGateway } from "@main/capabilities/playbackGateway";

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
}

function createBootstrap(
  authorityId = "authority-a",
  sequence = 1,
  sessionId = "session-a",
): PlaybackBootstrap<string[]> {
  return {
    anchor: {
      positionMs: 34_000,
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
      lyrics: ["line one"],
      lyricsVersion: 1,
      phase: "playing",
      track: {
        artistNames: ["Scopify"],
        id: 42,
        title: "Gateway",
      },
      volume: 80,
    },
    type: "bootstrap",
  };
}

function createCommandIdFactory(...ids: string[]) {
  let cursor = 0;
  return () => ids[cursor++] ?? `gateway-command-${cursor}`;
}

describe("Main playback gateway", () => {
  test("returns an Authority-unavailable receipt instead of inventing a local playback result", async () => {
    const broker = createPlaybackBroker();
    const gateway = createPlaybackGateway(broker, {
      commandIdFactory: createCommandIdFactory("no-authority-play"),
    });

    expect(gateway.getSnapshot()).toBeNull();
    await expect(gateway.play()).resolves.toEqual({
      commandId: "no-authority-play",
      reason: "playback-authority-unavailable",
      status: "unavailable",
    });

    gateway.dispose();
    broker.dispose();
  });

  test("projects coherent Broker state and resolves only the matching Authority receipt", async () => {
    const broker = createPlaybackBroker<string[]>();
    const authority = new MemoryPlaybackPort();
    broker.registerAuthority("authority-connection", authority);
    authority.receive(createBootstrap("authority-runtime"));

    const gateway = createPlaybackGateway(broker, {
      commandIdFactory: createCommandIdFactory("play-1"),
    });
    const notifications: Array<string | null> = [];
    const unsubscribe = gateway.subscribe((snapshot) => {
      notifications.push(snapshot?.track?.title ?? null);
    });

    const initial = gateway.getSnapshot();
    expect(initial).toMatchObject({
      authorityId: "authority-runtime",
      connection: "connected",
      isPlaying: true,
      positionMs: 34_000,
      sessionId: "session-a",
    });
    if (!initial?.track) throw new Error("Expected a playback track.");
    initial.track.title = "caller mutation";
    expect(gateway.getSnapshot()?.track?.title).toBe("Gateway");

    const receipt = gateway.play();
    expect(authority.posted.at(-1)).toEqual({
      commandId: "play-1",
      type: "play",
    } satisfies PlaybackCommand);
    authority.receive({
      commandId: "other-command",
      status: "accepted",
    } satisfies PlaybackCommandReceipt);
    authority.receive({ commandId: "play-1", status: "accepted" } satisfies PlaybackCommandReceipt);

    await expect(receipt).resolves.toEqual({ commandId: "play-1", status: "accepted" });

    const bootstrap = createBootstrap("authority-runtime", 2);
    authority.receive({
      ...bootstrap,
      sampledAtMs: 2_000,
      state: { ...bootstrap.state, volume: 55 },
      timelineRevision: 0,
      type: "state-changed",
    });
    expect(gateway.getSnapshot()?.volume).toBe(55);
    expect(notifications).toEqual(["Gateway"]);

    unsubscribe();
    gateway.dispose();
    broker.dispose();
  });

  test("waits for the Broker-owned receipt timeout", async () => {
    const broker = createPlaybackBroker({ commandReceiptTimeoutMs: 5 });
    const authority = new MemoryPlaybackPort();
    broker.registerAuthority("authority-connection", authority);
    authority.receive(createBootstrap());
    const gateway = createPlaybackGateway(broker, {
      commandIdFactory: createCommandIdFactory("slow-next"),
    });

    const pending = gateway.next();
    // Broker timers are intentionally unref'ed so a real Electron process can
    // exit normally. Keep this test alive until its receipt deadline passes.
    await Bun.sleep(15);
    await expect(pending).resolves.toEqual({
      commandId: "slow-next",
      reason: "command-receipt-timeout",
      status: "unavailable",
    });
    expect(broker.getDiagnostics().pendingCommandCount).toBe(0);

    gateway.dispose();
    broker.dispose();
  });

  test("settles in-flight work and clears the projected state when Authority is replaced", async () => {
    const broker = createPlaybackBroker();
    const firstAuthority = new MemoryPlaybackPort();
    const secondAuthority = new MemoryPlaybackPort();
    broker.registerAuthority("authority-a", firstAuthority);
    firstAuthority.receive(createBootstrap("authority-a"));
    const gateway = createPlaybackGateway(broker, {
      commandIdFactory: createCommandIdFactory("pause-before-replace"),
    });

    const pending = gateway.pause();
    broker.registerAuthority("authority-b", secondAuthority);

    await expect(pending).resolves.toEqual({
      commandId: "pause-before-replace",
      reason: "playback-authority-replaced",
      status: "unavailable",
    });
    expect(gateway.getSnapshot()).toBeNull();

    secondAuthority.receive(createBootstrap("authority-b", 0, "session-b"));
    expect(gateway.getSnapshot()).toMatchObject({
      authorityId: "authority-b",
      sessionId: "session-b",
    });

    gateway.dispose();
    broker.dispose();
  });

  test("disposal releases the trusted Replica and settles pending commands", async () => {
    const broker = createPlaybackBroker();
    const authority = new MemoryPlaybackPort();
    broker.registerAuthority("authority", authority);
    authority.receive(createBootstrap());
    const gateway = createPlaybackGateway(broker, {
      commandIdFactory: createCommandIdFactory("pending-pause"),
    });

    const pending = gateway.pause();
    gateway.dispose();

    await expect(pending).resolves.toEqual({
      commandId: "pending-pause",
      reason: "playback-gateway-disposed",
      status: "unavailable",
    });
    expect(broker.getDiagnostics().replicaCount).toBe(0);
    expect(gateway.getSnapshot()).toBeNull();
    await expect(gateway.play()).resolves.toMatchObject({
      reason: "playback-gateway-disposed",
      status: "unavailable",
    });

    broker.dispose();
  });

  test("surfaces Broker disposal to pending and future callers", async () => {
    const broker = createPlaybackBroker();
    const authority = new MemoryPlaybackPort();
    broker.registerAuthority("authority", authority);
    authority.receive(createBootstrap());
    const gateway = createPlaybackGateway(broker, {
      commandIdFactory: createCommandIdFactory("pending-next"),
    });

    const pending = gateway.next();
    broker.dispose();

    await expect(pending).resolves.toEqual({
      commandId: "pending-next",
      reason: "playback-broker-disposed",
      status: "unavailable",
    });
    expect(gateway.getSnapshot()).toBeNull();
    await expect(gateway.next()).resolves.toMatchObject({
      reason: "playback-broker-disposed",
      status: "unavailable",
    });

    gateway.dispose();
  });
});
