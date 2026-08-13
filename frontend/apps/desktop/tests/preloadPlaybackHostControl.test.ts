import { describe, expect, test } from "bun:test";

import {
  createPlaybackHostControlPreloadTransport,
  type PlaybackHostControlRendererChannel,
  type PlaybackHostControlRendererPort,
} from "@/main/preloadPlaybackHostControl";

class FakePort implements PlaybackHostControlRendererPort {
  closed = false;
  readonly sent: unknown[] = [];
  started = false;
  onclose: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null;

  close() {
    this.closed = true;
  }

  postMessage(message: unknown) {
    if (this.closed) throw new Error("closed");
    this.sent.push(message);
  }

  start() {
    this.started = true;
  }

  deliver(message: unknown) {
    this.onmessage?.({ data: message } as MessageEvent<unknown>);
  }

  fail() {
    this.onmessageerror?.({} as MessageEvent<unknown>);
  }
}

function createSession(revision = 3) {
  return {
    intent: "play" as const,
    quality: "standard" as const,
    queue: {
      historyIndex: 0,
      historyStack: [0],
      originalQueue: [
        {
          album: { artworkUrl: "https://example.test/art", id: 2, title: "album" },
          artists: [{ id: 3, name: "artist" }],
          durationMs: 1000,
          fee: 0,
          id: 1,
          publishTime: 0,
          title: "track",
        },
      ],
      playlistId: null,
      queue: [
        {
          album: { artworkUrl: "https://example.test/art", id: 2, title: "album" },
          artists: [{ id: 3, name: "artist" }],
          durationMs: 1000,
          fee: 0,
          id: 1,
          publishTime: 0,
          title: "track",
        },
      ],
      queueIndex: 0,
      repeatMode: "off" as const,
      shuffleEnabled: false,
    },
    resumePositionMs: 0,
    revision,
    volume: 1,
  };
}

const replaceCommand = {
  commandId: "command-1",
  protocolVersion: 1 as const,
  session: createSession(),
  type: "replace-session" as const,
};

const queueCommands = [
  {
    addToHistory: true,
    commandId: "queue-select",
    index: 0,
    protocolVersion: 1 as const,
    type: "select-queue-index" as const,
  },
  {
    commandId: "queue-replace",
    playlistId: null,
    play: true,
    protocolVersion: 1 as const,
    queue: createSession().queue.queue,
    startIndex: 0,
    type: "replace-queue" as const,
  },
  {
    commandId: "queue-repeat",
    protocolVersion: 1 as const,
    repeatMode: "all" as const,
    type: "set-repeat-mode" as const,
  },
  {
    commandId: "queue-set-shuffle",
    enabled: true,
    protocolVersion: 1 as const,
    type: "set-shuffle" as const,
  },
  {
    commandId: "queue-toggle-shuffle",
    protocolVersion: 1 as const,
    type: "toggle-shuffle" as const,
  },
  {
    commandId: "queue-reshuffle",
    protocolVersion: 1 as const,
    type: "reshuffle-queue" as const,
  },
  {
    commandId: "queue-move",
    fromIndex: 0,
    protocolVersion: 1 as const,
    toIndex: 0,
    type: "move-queue-item" as const,
  },
  {
    commandId: "queue-move-next",
    index: 0,
    protocolVersion: 1 as const,
    type: "move-queue-item-to-next" as const,
  },
  {
    commandId: "queue-remove",
    index: 0,
    protocolVersion: 1 as const,
    type: "remove-queue-item" as const,
  },
] as const;

const clientCommands = [replaceCommand, ...queueCommands];

const receipt = {
  commandId: "command-1",
  protocolVersion: 1 as const,
  revision: 3,
  status: "applied" as const,
  type: "command-receipt" as const,
};

const snapshot = {
  protocolVersion: 1 as const,
  session: createSession(),
  type: "session-snapshot" as const,
};

function createHarness() {
  const channels: PlaybackHostControlRendererChannel[] = [];
  const connected: Array<{ connectionId: string; port: MessagePort; role: string }> = [];
  const transport = createPlaybackHostControlPreloadTransport("client", {
    createChannel: () => {
      const channel = { port1: new FakePort(), port2: new FakePort() as unknown as MessagePort };
      channels.push(channel);
      return channel;
    },
    connectPort: (connectionId, role, port) => connected.push({ connectionId, port, role }),
  });
  return { channels, connected, transport };
}

describe("Playback Host control preload transport", () => {
  test("uses a dedicated client port and accepts every client command direction", () => {
    const { channels, connected, transport } = createHarness();
    const firstClose: string[] = [];
    transport.connect(
      "first",
      () => undefined,
      () => firstClose.push("closed"),
    );
    transport.connect(
      "second",
      () => undefined,
      () => firstClose.push("closed"),
    );

    expect((channels[0]?.port1 as FakePort).closed).toBe(true);
    expect((channels[1]?.port1 as FakePort).started).toBe(true);
    expect(connected.map(({ connectionId, role }) => ({ connectionId, role }))).toEqual([
      { connectionId: "first", role: "client" },
      { connectionId: "second", role: "client" },
    ]);
    expect(firstClose).toEqual([]);
    for (const command of clientCommands) {
      expect(transport.send(command)).toBe(true);
    }
    expect((channels[1]?.port1 as FakePort).sent).toEqual(clientCommands);
    expect(transport.send(receipt as never)).toBe(false);
    expect(transport.send(snapshot as never)).toBe(false);
  });

  test("accepts only client inbound receipt or snapshot and reports port failures", () => {
    const { channels, transport } = createHarness();
    const received: unknown[] = [];
    const closed: string[] = [];
    transport.connect(
      "client",
      (payload) => received.push(payload),
      () => closed.push("closed"),
    );
    const port = channels[0]?.port1 as FakePort;

    port.deliver(replaceCommand);
    port.deliver(receipt);
    port.deliver(snapshot);
    expect(received).toEqual([receipt, snapshot]);

    port.fail();
    expect(port.closed).toBe(true);
    expect(closed).toEqual(["closed"]);
    expect(transport.send(replaceCommand)).toBe(false);
  });

  test("the host endpoint accepts every client command and can only send host responses", () => {
    const channels: PlaybackHostControlRendererChannel[] = [];
    const roles: string[] = [];
    const transport = createPlaybackHostControlPreloadTransport("host", {
      createChannel: () => {
        const channel = { port1: new FakePort(), port2: new FakePort() as unknown as MessagePort };
        channels.push(channel);
        return channel;
      },
      connectPort: (_connectionId, role) => roles.push(role),
    });
    const received: unknown[] = [];
    transport.connect(
      "host",
      (payload) => received.push(payload),
      () => undefined,
    );
    const port = channels[0]?.port1 as FakePort;

    port.deliver(receipt);
    port.deliver(snapshot);
    clientCommands.forEach((command) => port.deliver(command));
    expect(received).toEqual(clientCommands);
    expect(transport.send(receipt)).toBe(true);
    expect(transport.send(snapshot)).toBe(true);
    for (const command of clientCommands) {
      expect(transport.send(command as never)).toBe(false);
    }
    expect(roles).toEqual(["host"]);
  });
});
