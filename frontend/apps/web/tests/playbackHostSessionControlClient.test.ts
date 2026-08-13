import { describe, expect, it } from "bun:test";

import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackHostControlReceipt,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackHostSessionSnapshot,
} from "@scopify/desktop-contract/playbackHostControl";

import {
  PlaybackHostSessionControlClient,
  type PlaybackHostSessionControlClientPlayerState,
} from "@/lib/playbackHost/sessionControlClient";
import type {
  RuntimePlaybackHostControl,
  RuntimePlaybackHostControlClientPayload,
  RuntimePlaybackHostControlConnection,
  RuntimePlaybackHostControlHostPayload,
} from "@/lib/runtime";
import type { SongDetail } from "@/types/api/music";

class FakeClientConnection implements RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlHostPayload> {
  readonly sent: RuntimePlaybackHostControlHostPayload[] = [];
  closed = false;

  constructor(
    private readonly onPayload: (payload: RuntimePlaybackHostControlClientPayload) => void,
    private readonly onClose: () => void,
  ) {}

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.onClose();
  }

  deliver(payload: RuntimePlaybackHostControlClientPayload): void {
    this.onPayload(payload);
  }

  send(payload: RuntimePlaybackHostControlHostPayload): boolean {
    if (this.closed) return false;
    this.sent.push(payload);
    return true;
  }
}

class FakeControl implements RuntimePlaybackHostControl {
  readonly clients: FakeClientConnection[] = [];

  connectClient(
    _connectionId: string,
    onPayload: (payload: RuntimePlaybackHostControlClientPayload) => void,
    onClose: () => void,
  ): RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlHostPayload> {
    const connection = new FakeClientConnection(onPayload, onClose);
    this.clients.push(connection);
    return connection;
  }

  connectHost(): RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlClientPayload> {
    throw new Error("The Main control client must never open a Host control port.");
  }
}

function createSong(id: number): SongDetail {
  return {
    al: { id: id + 10_000, name: `Album ${id}`, picUrl: `https://img/${id}` },
    ar: [{ id: id + 20_000, name: `Artist ${id}` }],
    dt: 180_000,
    fee: 0,
    id,
    name: `Track ${id}`,
    publishTime: 1_700_000_000_000,
  };
}

function createPlayerState(): PlaybackHostSessionControlClientPlayerState {
  const first = createSong(1);
  const second = createSong(2);
  return {
    historyIndex: 1,
    historyStack: [1, 0],
    isPlaying: true,
    isShuffle: true,
    musicQuality: "lossless",
    originalQueue: [first, second],
    playlistId: "playlist-1",
    queue: [second, first],
    queueIndex: 0,
    repeatMode: "all",
    volume: 65,
  };
}

function createSnapshot(
  command: PlaybackHostReplaceSessionCommand,
  revision = command.session.revision,
): PlaybackHostSessionSnapshot {
  return {
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    session: { ...command.session, revision },
    type: "session-snapshot",
  };
}

function createReceipt(
  command: PlaybackHostReplaceSessionCommand,
  overrides: Partial<PlaybackHostControlReceipt>,
): PlaybackHostControlReceipt {
  return {
    commandId: command.commandId,
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    revision: command.session.revision,
    status: "applied",
    type: "command-receipt",
    ...overrides,
  };
}

describe("PlaybackHostSessionControlClient", () => {
  it("sends a complete, monotonically revised seed on first connect and reconnect", () => {
    const control = new FakeControl();
    const player = createPlayerState();
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 12_345,
    });

    expect(client.connect()).toBe(true);
    const first = control.clients[0]?.sent[0];
    expect(first).toEqual({
      commandId: "playback-host-session-1",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      session: {
        intent: "play",
        quality: "lossless",
        queue: {
          historyIndex: 1,
          historyStack: [1, 0],
          originalQueue: [
            expect.objectContaining({ id: 1, title: "Track 1" }),
            expect.objectContaining({ id: 2, title: "Track 2" }),
          ],
          playlistId: "playlist-1",
          queue: [
            expect.objectContaining({ id: 2, title: "Track 2" }),
            expect.objectContaining({ id: 1, title: "Track 1" }),
          ],
          queueIndex: 0,
          repeatMode: "all",
          shuffleEnabled: true,
        },
        resumePositionMs: 12_345,
        revision: 1,
        volume: 0.65,
      },
      type: "replace-session",
    });

    expect(client.connect()).toBe(true);
    const second = control.clients[1]?.sent[0];
    expect(control.clients[0]?.closed).toBe(true);
    expect(second).toMatchObject({
      commandId: "playback-host-session-2",
      session: { revision: 2 },
      type: "replace-session",
    });
  });

  it("holds a queue command completion until the Host snapshot has caught up", async () => {
    const control = new FakeControl();
    const player = createPlayerState();
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });
    client.connect();
    const connection = control.clients[0]!;
    const seed = connection.sent[0] as PlaybackHostReplaceSessionCommand;

    let settled = false;
    const completion = client
      .dispatchQueueCommand({ index: 2, type: "remove-queue-item" })
      .then((result) => {
        settled = true;
        return result;
      });
    const command = connection.sent[1];
    expect(command).toMatchObject({
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "remove-queue-item",
    });

    connection.deliver({
      commandId: command.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      revision: 2,
      status: "applied",
      type: "command-receipt",
    });
    await Promise.resolve();
    expect(settled).toBeFalse();

    connection.deliver(createSnapshot(seed, 2));
    await expect(completion).resolves.toEqual({ status: "applied" });
  });

  it("fails a queued intent closed when its Host command is rejected or the port closes", async () => {
    const control = new FakeControl();
    const player = createPlayerState();
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });
    client.connect();
    const connection = control.clients[0]!;

    const rejected = client.dispatchQueueCommand({ enabled: true, type: "set-shuffle" });
    const rejectedCommand = connection.sent[1];
    connection.deliver({
      commandId: rejectedCommand.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      reason: "queue-command-rejected",
      revision: 1,
      status: "rejected",
      type: "command-receipt",
    });
    await expect(rejected).resolves.toEqual({
      reason: "queue-command-rejected",
      status: "rejected",
    });

    const unavailable = client.dispatchQueueCommand({ type: "toggle-shuffle" });
    connection.close();
    await expect(unavailable).resolves.toEqual({
      reason: "playback-host-control-closed",
      status: "unavailable",
    });
  });

  it("does not echo a Host snapshot back through a synchronous player subscription", () => {
    const control = new FakeControl();
    let player = createPlayerState();
    const applied: PlaybackHostSessionSnapshot[] = [];
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: (snapshot, projection) => {
        applied.push(snapshot);
        player = { ...player, ...projection };
        expect(client.notifyPlayerStateChanged()).toBe(false);
      },
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });

    client.connect();
    const connection = control.clients[0]!;
    const first = connection.sent[0] as PlaybackHostReplaceSessionCommand;
    connection.deliver(createSnapshot(first, 8));

    expect(applied).toHaveLength(1);
    expect(connection.sent).toHaveLength(1);
    expect(client.notifyPlayerStateChanged()).toBe(false);
  });

  it("does not promote a stale Main seed over the Host's newer session", () => {
    const control = new FakeControl();
    const player = createPlayerState();
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });

    client.connect();
    const connection = control.clients[0]!;
    const first = connection.sent[0] as PlaybackHostReplaceSessionCommand;
    connection.deliver(
      createReceipt(first, {
        reason: "stale-session-revision",
        revision: 5,
        status: "rejected",
      }),
    );

    // Retrying at revision 6 would overwrite a Host-owned queue transition
    // that happened while this copied Main state was in flight.
    expect(connection.sent).toHaveLength(1);
    expect(client.getDiagnostics().currentRevision).toBe(5);
  });

  it("requests serialized Host recovery after an unavailable receipt while keeping durable updates quiet", () => {
    const control = new FakeControl();
    const player = createPlayerState();
    const recoveryReasons: string[] = [];
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      onHostRecoveryRequired: (reason) => recoveryReasons.push(reason),
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });

    client.connect();
    const connection = control.clients[0]!;
    const first = connection.sent[0] as PlaybackHostReplaceSessionCommand;
    connection.deliver(
      createReceipt(first, {
        reason: "playback-host-unavailable",
        status: "rejected",
      }),
    );

    expect(recoveryReasons).toEqual(["playback-host-unavailable"]);
    expect(client.notifyPlayerStateChanged()).toBe(false);
    expect(connection.sent).toHaveLength(1);

    // Every scheduled reconnect uses connect(), which forces a complete seed
    // even though the durable Main state has not changed during the outage.
    expect(client.connect()).toBe(true);
    const recoveredSeed = control.clients[1]?.sent[0] as PlaybackHostReplaceSessionCommand;
    expect(recoveredSeed).toMatchObject({
      commandId: "playback-host-session-2",
      session: {
        queue: first.session.queue,
        revision: 2,
      },
    });
  });

  it("sends a valid empty session after a running queue is cleared", () => {
    const control = new FakeControl();
    let player = createPlayerState();
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });

    client.connect();
    player = {
      ...player,
      historyIndex: -1,
      historyStack: [],
      isPlaying: false,
      originalQueue: [],
      playlistId: null,
      queue: [],
      queueIndex: -1,
    };

    expect(client.notifyPlayerStateChanged()).toBe(true);
    expect(control.clients[0]?.sent[1]).toMatchObject({
      session: {
        intent: "pause",
        queue: {
          historyIndex: -1,
          historyStack: [],
          originalQueue: [],
          playlistId: null,
          queue: [],
          queueIndex: -1,
        },
        revision: 2,
      },
    });
  });

  it("notifies only when the active connection closes without an explicit replacement", () => {
    const control = new FakeControl();
    const player = createPlayerState();
    let closeNotifications = 0;
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: () => {},
      connectionId: "desktop-main-control",
      control,
      onConnectionClosed: () => {
        closeNotifications += 1;
      },
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });

    client.connect();
    const firstConnection = control.clients[0]!;
    client.connect();
    expect(closeNotifications).toBe(0);

    firstConnection.close();
    expect(closeNotifications).toBe(0);

    control.clients[1]!.close();
    expect(closeNotifications).toBe(1);
    expect(client.getDiagnostics().active).toBe(false);

    client.close();
    expect(closeNotifications).toBe(1);
  });

  it("becomes silent after close, including for late transport callbacks", () => {
    const control = new FakeControl();
    const player = createPlayerState();
    const applied: PlaybackHostSessionSnapshot[] = [];
    const client = new PlaybackHostSessionControlClient({
      applySnapshot: (snapshot) => applied.push(snapshot),
      connectionId: "desktop-main-control",
      control,
      readPlayerState: () => player,
      readResumePositionMs: () => 0,
    });

    client.connect();
    const connection = control.clients[0]!;
    const command = connection.sent[0] as PlaybackHostReplaceSessionCommand;
    client.close();
    connection.deliver(createSnapshot(command, 9));

    expect(client.notifyPlayerStateChanged()).toBe(false);
    expect(connection.sent).toHaveLength(1);
    expect(applied).toHaveLength(0);
    expect(client.getDiagnostics()).toMatchObject({ active: false, closed: true });
  });
});
