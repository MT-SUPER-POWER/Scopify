import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackProjection,
  PlaybackTransportPayload,
  PlaybackTransportRole,
} from "@scopify/desktop-contract";
import { PLAYBACK_PROTOCOL_VERSION } from "@scopify/desktop-contract";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "bun:test";

import { PlaybackProjectionProvider } from "@/components/player/PlaybackProjectionProvider";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { ManualPlaybackClock } from "@/lib/playbackProjection/clock";
import {
  createElectronPlaybackAuthorityTransport,
  createElectronPlaybackReplicaTransport,
} from "@/lib/playbackProjection/electronTransport";
import type { PlaybackProjectionSource } from "@/types/playbackProjection";
import type { PlaybackCommands, PlaybackRendererPort } from "@/types/playbackTransport";

const INITIAL_PROJECTION: PlaybackProjection = {
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
};

class TestProjectionSource implements PlaybackProjectionSource {
  readonly commands: PlaybackCommand[] = [];
  getSnapshotCalls = 0;

  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    this.commands.push(command);
    return Promise.resolve({ commandId: command.commandId, status: "accepted" });
  }

  getSnapshot(): PlaybackProjection {
    this.getSnapshotCalls += 1;
    return { ...INITIAL_PROJECTION };
  }

  subscribe(): () => void {
    return () => undefined;
  }
}

class TestRendererPort<TLyrics = unknown> implements PlaybackRendererPort<TLyrics> {
  connectionId: string | null = null;
  role: PlaybackTransportRole | null = null;
  readonly sent: PlaybackTransportPayload<TLyrics>[] = [];
  sendSucceeds = true;
  private onClose: (() => void) | null = null;
  private onPayload: ((payload: PlaybackTransportPayload<TLyrics>) => void) | null = null;

  connect(
    role: PlaybackTransportRole,
    connectionId: string,
    onPayload: (payload: PlaybackTransportPayload<TLyrics>) => void,
    onClose: () => void,
  ) {
    this.role = role;
    this.connectionId = connectionId;
    this.onPayload = onPayload;
    this.onClose = onClose;
    return () => {
      this.onPayload = null;
      this.onClose = null;
    };
  }

  deliver(payload: PlaybackTransportPayload<TLyrics>) {
    this.onPayload?.(payload);
  }

  disconnect() {
    this.onClose?.();
  }

  send(payload: PlaybackTransportPayload<TLyrics>) {
    if (!this.sendSucceeds) return false;
    this.sent.push(payload);
    return true;
  }
}

function createBootstrap(positionMs: number, sampledAtMs: number) {
  return {
    anchor: { positionMs, rate: 1, sampledAtMs, timelineRevision: 0 },
    authorityId: "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence: 1,
    sessionId: "session-a",
    state: {
      canControl: true,
      durationMs: 180_000,
      liked: false,
      lyrics: null,
      lyricsVersion: null,
      phase: "playing" as const,
      track: { artistNames: ["Artist"], id: 1, title: "Song" },
      volume: 80,
    },
    type: "bootstrap" as const,
  };
}

describe("Playback React Adapter", () => {
  test("gives useSyncExternalStore a stable cached message snapshot", () => {
    const source = new TestProjectionSource();

    function Consumer() {
      const first = usePlaybackProjection();
      const second = usePlaybackProjection();
      return <span>{`${first.sessionId}:${second.positionMs}`}</span>;
    }

    const markup = renderToStaticMarkup(
      <PlaybackProjectionProvider source={source}>
        <Consumer />
      </PlaybackProjectionProvider>,
    );

    expect(markup).toContain("session-a:12000");
    expect(source.getSnapshotCalls).toBe(1);
  });

  test("creates unique command IDs and returns the source receipts", async () => {
    const source = new TestProjectionSource();
    let commands: PlaybackCommands | null = null;

    function Consumer() {
      commands = usePlaybackCommands();
      return null;
    }

    renderToStaticMarkup(
      <PlaybackProjectionProvider source={source}>
        <Consumer />
      </PlaybackProjectionProvider>,
    );

    const commandApi = commands as PlaybackCommands | null;
    if (!commandApi) throw new Error("Playback commands were not exposed by the test consumer");
    await expect(commandApi.seek(20_000)).resolves.toMatchObject({ status: "accepted" });
    await expect(commandApi.seek(25_000)).resolves.toMatchObject({ status: "accepted" });

    expect(source.commands).toHaveLength(2);
    expect(source.commands[0]).toMatchObject({ positionMs: 20_000, type: "seek" });
    expect(source.commands[1]).toMatchObject({ positionMs: 25_000, type: "seek" });
    expect(source.commands[0]?.commandId).not.toBe(source.commands[1]?.commandId);
  });
});

describe("Electron playback Renderer transport", () => {
  test("feeds reliable messages to a Replica and correlates command receipts", async () => {
    const clock = new ManualPlaybackClock(1_000);
    const port = new TestRendererPort();
    const transport = createElectronPlaybackReplicaTransport({
      clock,
      connectionId: "controller-window",
      port,
    });

    expect(port.role).toBe("replica");
    expect(port.connectionId).toBe("controller-window");
    port.deliver(createBootstrap(10_000, clock.nowMs()));
    expect(transport.source.getSnapshot()).toMatchObject({
      connection: "connected",
      positionMs: 10_000,
    });

    const receiptPromise = transport.source.dispatch({ commandId: "toggle-1", type: "toggle" });
    expect(port.sent.at(-1)).toEqual({ commandId: "toggle-1", type: "toggle" });
    port.deliver({ commandId: "toggle-1", status: "accepted" });
    await expect(receiptPromise).resolves.toEqual({ commandId: "toggle-1", status: "accepted" });

    clock.advanceBy(2_000);
    port.disconnect();
    clock.advanceBy(5_000);
    expect(transport.source.getSnapshot()).toMatchObject({
      connection: "disconnected",
      positionMs: 12_000,
    });
  });

  test("bounds missing command receipts with a timeout", async () => {
    const clock = new ManualPlaybackClock(2_000);
    const port = new TestRendererPort();
    const transport = createElectronPlaybackReplicaTransport({
      clock,
      commandTimeoutMs: 5,
      connectionId: "lyrics-window",
      port,
    });
    port.deliver(createBootstrap(0, clock.nowMs()));

    await expect(
      transport.source.dispatch({ commandId: "pause-timeout", type: "pause" }),
    ).resolves.toEqual({
      commandId: "pause-timeout",
      reason: "command-receipt-timeout",
      status: "unavailable",
    });
  });

  test("binds an Authority without exposing Electron or runtime types", async () => {
    const port = new TestRendererPort();
    const transport = createElectronPlaybackAuthorityTransport({
      connectionId: "authority-a",
      port,
    });
    let bootstrapRequests = 0;

    const disconnect = transport.connectAuthority({
      dispatch: async (command) => ({ commandId: command.commandId, status: "accepted" }),
      requestBootstrap: () => {
        bootstrapRequests += 1;
      },
    });

    expect(port.role).toBe("authority");
    expect(port.connectionId).toBe("authority-a");
    expect(bootstrapRequests).toBe(1);
    port.deliver({ type: "request-bootstrap" });
    expect(bootstrapRequests).toBe(2);
    expect(transport.publish(createBootstrap(0, 1_000))).toBeTrue();

    port.deliver({ commandId: "next-1", type: "next" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(port.sent.at(-1)).toEqual({ commandId: "next-1", status: "accepted" });

    disconnect();
    expect(transport.publish(createBootstrap(0, 1_000))).toBeFalse();
  });
});
