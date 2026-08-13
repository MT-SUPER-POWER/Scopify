import { describe, expect, test } from "bun:test";

import type {
  PlaybackHostClientCommand,
  PlaybackHostControlReceipt,
  PlaybackHostReplaceSessionCommand,
  PlaybackHostSessionSnapshot,
} from "@scopify/desktop-contract";
import { PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION } from "@scopify/desktop-contract";
import type { PlaybackCheckpoint } from "@scopify/desktop-contract/playbackCheckpoint";

import {
  createPlaybackHostControlBroker,
  createOwnedPlaybackHostControlConnectionId,
  parsePlaybackHostControlConnectionRequest,
  type PlaybackHostControlPort,
} from "@/main/module/playbackHostControl";
import type {
  PlaybackHostCheckpointDiagnostics,
  PlaybackHostCheckpointRepository,
} from "@/main/module/playbackHost/checkpoint";

class MemoryPlaybackHostControlPort implements PlaybackHostControlPort {
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
    if (this.closed) throw new Error("memory Playback Host control port closed");
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

class MemoryCheckpointRepository implements PlaybackHostCheckpointRepository {
  checkpoint: PlaybackCheckpoint | null = null;
  clearSucceeds = true;
  readonly calls: string[] = [];
  loadDeferred: Promise<PlaybackCheckpoint | null> | null = null;
  saveSucceeds = true;
  readonly saved: PlaybackCheckpoint[] = [];

  async clear() {
    this.calls.push("clear");
    if (this.clearSucceeds) this.checkpoint = null;
    return this.clearSucceeds;
  }

  getDiagnostics(): PlaybackHostCheckpointDiagnostics {
    return {
      checkpointPath: "/test/checkpoint.json",
      clearCount: 0,
      invalidCheckpointCount: 0,
      lastIssue: null,
      loadCount: 0,
      missingLoadCount: 0,
      saveCount: 0,
      temporaryPath: "/test/checkpoint.json.tmp",
    };
  }

  async load() {
    this.calls.push("load");
    if (this.loadDeferred) return this.loadDeferred;
    return this.checkpoint ? structuredClone(this.checkpoint) : null;
  }

  async save(checkpoint: unknown) {
    this.calls.push("save");
    if (!this.saveSucceeds) return false;
    this.checkpoint = structuredClone(checkpoint) as PlaybackCheckpoint;
    this.saved.push(structuredClone(this.checkpoint));
    return true;
  }
}

function createCommand(commandId = "replace-1", revision = 1): PlaybackHostReplaceSessionCommand {
  return {
    commandId,
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    session: {
      intent: "pause",
      quality: "high",
      queue: {
        historyIndex: -1,
        historyStack: [],
        originalQueue: [],
        playlistId: null,
        queue: [],
        queueIndex: -1,
        repeatMode: "off",
        shuffleEnabled: false,
      },
      resumePositionMs: 0,
      revision,
      volume: 0.8,
    },
    type: "replace-session",
  };
}

function createReceipt(command: PlaybackHostReplaceSessionCommand): PlaybackHostControlReceipt {
  return {
    commandId: command.commandId,
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    revision: command.session.revision,
    status: "applied",
    type: "command-receipt",
  };
}

function createSnapshot(command: PlaybackHostReplaceSessionCommand): PlaybackHostSessionSnapshot {
  return {
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    session: command.session,
    type: "session-snapshot",
  };
}

function createSetShuffleCommand(
  commandId = "shuffle-1",
  enabled = true,
): Extract<PlaybackHostClientCommand, { type: "set-shuffle" }> {
  return {
    commandId,
    enabled,
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    type: "set-shuffle",
  };
}

function createNonEmptyCommand(
  commandId = "non-empty",
  revision = 1,
): PlaybackHostReplaceSessionCommand {
  const command = createCommand(commandId, revision);
  const entry = {
    album: { artworkUrl: "https://image.example/cover.jpg", id: 8, title: "Album" },
    artists: [{ id: 2, name: "Artist" }],
    durationMs: 180_000,
    fee: 0,
    id: 1,
    publishTime: 1_700_000_000_000,
    title: "Track",
  };
  command.session.queue = {
    historyIndex: 0,
    historyStack: [0],
    originalQueue: [entry],
    playlistId: 77,
    queue: [entry],
    queueIndex: 0,
    repeatMode: "all",
    shuffleEnabled: false,
  };
  return command;
}

function createCheckpoint(command: PlaybackHostReplaceSessionCommand): PlaybackCheckpoint {
  return {
    protocolVersion: 1,
    savedAtMs: 1_700_000_000_000,
    session: structuredClone(command.session),
  };
}

async function flushAsyncWork() {
  for (let step = 0; step < 8; step += 1) await Promise.resolve();
}

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

describe("PlaybackHostControlBroker", () => {
  test("reliably routes validated commands, receipts, and snapshots between its one client and host", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host);

    const command = createCommand();
    client.receive(command);
    expect(host.posted).toEqual([command]);

    const receipt = createReceipt(command);
    host.receive(receipt);
    expect(client.posted).toEqual([receipt]);

    const snapshot = createSnapshot(command);
    host.receive(snapshot);
    expect(client.posted).toEqual([receipt, snapshot]);
    expect(broker.getDiagnostics()).toMatchObject({
      commandReceiptsRouted: 1,
      commandsForwarded: 1,
      pendingCommandCount: 0,
      snapshotsRouted: 1,
    });
  });

  test("routes every validated queue command by command ID and preserves the Host receipt revision", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host);

    const command = createSetShuffleCommand("queue-shuffle");
    client.receive(command);
    expect(host.posted).toEqual([command]);

    host.receive({
      commandId: command.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      revision: 14,
      status: "applied",
      type: "command-receipt",
    });
    expect(client.posted).toEqual([
      {
        commandId: "queue-shuffle",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        revision: 14,
        status: "applied",
        type: "command-receipt",
      },
    ]);
    expect(broker.getDiagnostics()).toMatchObject({
      commandReceiptsRouted: 1,
      commandsForwarded: 1,
      pendingCommandCount: 0,
    });
  });

  test("rejects a queue command while the Host is unavailable with the zero revision baseline", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host);

    host.remoteClose();
    client.receive(createSetShuffleCommand("unavailable-queue"));

    expect(client.posted.at(-1)).toEqual({
      commandId: "unavailable-queue",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      reason: "playback-host-unavailable",
      revision: 0,
      status: "rejected",
      type: "command-receipt",
    });
  });

  test("rejects rather than queues a command while no Playback Host is connected", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);

    const command = createCommand("host-missing", 4);
    client.receive(command);
    expect(client.posted).toEqual([
      {
        commandId: "host-missing",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        reason: "playback-host-unavailable",
        revision: 4,
        status: "rejected",
        type: "command-receipt",
      },
    ]);
    expect(broker.getDiagnostics()).toMatchObject({ pendingCommandCount: 0, rejectedCommands: 1 });
  });

  test("rejects payloads sent in the wrong direction", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host);

    const command = createCommand();
    client.receive(createReceipt(command));
    host.receive(command);
    host.receive(createSetShuffleCommand());

    expect(host.posted).toEqual([]);
    expect(client.posted).toEqual([]);
    expect(broker.getDiagnostics().lastRejection).toMatchObject({
      reason: "unexpected-host-payload",
      source: "host",
    });
  });

  test("contains pending receipts to their original client across client replacement", () => {
    const broker = createPlaybackHostControlBroker();
    const firstClient = new MemoryPlaybackHostControlPort();
    const replacementClient = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", firstClient);
    broker.registerHost("host-a", host);

    const command = createCommand("replace-client", 3);
    firstClient.receive(command);
    broker.registerClient("client-b", replacementClient);
    host.receive(createReceipt(command));

    expect(firstClient.closed).toBeTrue();
    expect(replacementClient.posted).toEqual([]);
    expect(broker.getDiagnostics()).toMatchObject({
      clientReplacements: 1,
      lastRejection: { reason: "unknown-command-receipt", source: "host" },
    });
  });

  test("fails pending commands when the host closes and preserves the command revision", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host);

    const command = createCommand("host-closed", 9);
    client.receive(command);
    host.remoteClose();

    expect(client.posted).toEqual([
      {
        commandId: "host-closed",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        reason: "playback-host-disconnected",
        revision: 9,
        status: "rejected",
        type: "command-receipt",
      },
    ]);
    expect(broker.getDiagnostics()).toMatchObject({
      activeHostConnectionId: null,
      hostDisconnects: 1,
      pendingCommandCount: 0,
    });
  });

  test("replaces a host atomically and refuses duplicate command IDs", () => {
    const broker = createPlaybackHostControlBroker();
    const client = new MemoryPlaybackHostControlPort();
    const firstHost = new MemoryPlaybackHostControlPort();
    const replacementHost = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", firstHost);

    const command = createCommand("same-id", 6);
    client.receive(command);
    broker.registerHost("host-b", replacementHost);
    client.receive(command);

    expect(firstHost.closed).toBeTrue();
    expect(replacementHost.posted).toEqual([]);
    expect(client.posted).toEqual([
      {
        commandId: "same-id",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        reason: "playback-host-replaced",
        revision: 6,
        status: "rejected",
        type: "command-receipt",
      },
      {
        commandId: "same-id",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        reason: "duplicate-command-id",
        revision: 6,
        status: "rejected",
        type: "command-receipt",
      },
    ]);
  });

  test("persists canonical Host snapshots serially and clears recovery when the queue is empty", async () => {
    const repository = new MemoryCheckpointRepository();
    const broker = createPlaybackHostControlBroker({
      checkpointRepository: repository,
      clock: { nowMs: () => 1_700_000_000_123 },
    });
    const host = new MemoryPlaybackHostControlPort();
    broker.registerHost("host-a", host);

    const playing = createNonEmptyCommand("persist", 4);
    const empty = createCommand("empty", 5);
    host.receive(createSnapshot(playing));
    host.receive(createSnapshot(empty));
    await flushAsyncWork();

    expect(repository.calls).toEqual(["load", "save", "clear"]);
    expect(repository.saved).toEqual([
      {
        protocolVersion: 1,
        savedAtMs: 1_700_000_000_123,
        session: playing.session,
      },
    ]);
    expect(broker.getDiagnostics()).toMatchObject({
      checkpointClearAttempts: 1,
      checkpointSaveAttempts: 1,
      checkpointPersistenceFailures: 0,
    });
  });

  test("restores a checkpoint directly to a connected Host and consumes its internal receipt", async () => {
    const repository = new MemoryCheckpointRepository();
    const recovered = createNonEmptyCommand("persisted", 4);
    repository.checkpoint = createCheckpoint(recovered);
    const broker = createPlaybackHostControlBroker({ checkpointRepository: repository });
    const host = new MemoryPlaybackHostControlPort();
    broker.registerHost("host-a", host);
    await flushAsyncWork();

    const recoveryCommand = host.posted[0] as PlaybackHostReplaceSessionCommand;
    const recoveryCommandId = recoveryCommand.commandId;
    expect(recoveryCommand).toMatchObject({
      commandId: expect.stringMatching(/^checkpoint-recovery:/),
      session: recovered.session,
      type: "replace-session",
    });
    expect(broker.getDiagnostics().pendingCommandCount).toBe(1);
    host.receive({
      commandId: recoveryCommandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      revision: recoveryCommand.session.revision,
      status: "applied",
      type: "command-receipt",
    });
    expect(broker.getDiagnostics()).toMatchObject({
      lastRejection: null,
      pendingCommandCount: 0,
      recoveryCommandsForwarded: 1,
    });
  });

  test("does not let an asynchronously loaded checkpoint overwrite a live newer client session", async () => {
    const repository = new MemoryCheckpointRepository();
    const deferredLoad = createDeferred<PlaybackCheckpoint | null>();
    repository.loadDeferred = deferredLoad.promise;
    const broker = createPlaybackHostControlBroker({ checkpointRepository: repository });
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host);

    const live = createNonEmptyCommand("live", 10);
    client.receive(live);
    expect(host.posted).toEqual([]);
    deferredLoad.resolve(createCheckpoint(createNonEmptyCommand("persisted", 9)));
    await flushAsyncWork();

    expect(host.posted).toEqual([live]);
    expect(broker.getDiagnostics()).toMatchObject({
      recoveryCommandsForwarded: 0,
      recoverySkips: 1,
    });
  });

  test("chooses a live command that arrives during checkpoint loading even when its revision is older", async () => {
    const repository = new MemoryCheckpointRepository();
    const deferredLoad = createDeferred<PlaybackCheckpoint | null>();
    repository.loadDeferred = deferredLoad.promise;
    const broker = createPlaybackHostControlBroker({ checkpointRepository: repository });
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    const ready: string[] = [];
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host, () => ready.push("settled"));

    const live = createNonEmptyCommand("live-before-load", 1);
    client.receive(live);
    expect(host.posted).toEqual([]);
    expect(ready).toEqual([]);

    deferredLoad.resolve(createCheckpoint(createNonEmptyCommand("persisted", 99)));
    await flushAsyncWork();

    expect(host.posted).toEqual([live]);
    expect(ready).toEqual(["settled"]);
    expect(broker.getDiagnostics()).toMatchObject({
      pendingCommandCount: 1,
      recoveryCommandsForwarded: 0,
      recoverySkips: 1,
    });
  });

  test("holds later live commands until an already-dispatched checkpoint receipt settles", async () => {
    const repository = new MemoryCheckpointRepository();
    const recovered = createNonEmptyCommand("persisted", 4);
    repository.checkpoint = createCheckpoint(recovered);
    const broker = createPlaybackHostControlBroker({ checkpointRepository: repository });
    const client = new MemoryPlaybackHostControlPort();
    const host = new MemoryPlaybackHostControlPort();
    const ready: string[] = [];
    broker.registerClient("client-a", client);
    broker.registerHost("host-a", host, () => ready.push("settled"));
    await flushAsyncWork();

    const recovery = host.posted[0] as PlaybackHostReplaceSessionCommand;
    const live = createNonEmptyCommand("live-after-recovery", 5);
    client.receive(live);
    expect(host.posted).toEqual([recovery]);
    expect(ready).toEqual([]);

    host.receive(createReceipt(recovery));

    expect(host.posted).toEqual([recovery, live]);
    expect(ready).toEqual(["settled"]);
    expect(broker.getDiagnostics()).toMatchObject({
      pendingCommandCount: 1,
      recoveryCommandsForwarded: 1,
    });
  });

  test("settles the control-ready barrier immediately when no checkpoint repository is configured", () => {
    const broker = createPlaybackHostControlBroker();
    const host = new MemoryPlaybackHostControlPort();
    const ready: string[] = [];

    broker.registerHost("host-a", host, () => ready.push("settled"));

    expect(ready).toEqual(["settled"]);
  });

  test("quarantines late recovery work and checkpoint persistence failures", async () => {
    const repository = new MemoryCheckpointRepository();
    repository.saveSucceeds = false;
    const deferredLoad = createDeferred<PlaybackCheckpoint | null>();
    repository.loadDeferred = deferredLoad.promise;
    const broker = createPlaybackHostControlBroker({ checkpointRepository: repository });
    const host = new MemoryPlaybackHostControlPort();
    broker.registerHost("host-a", host);

    host.receive(createSnapshot(createNonEmptyCommand("snapshot", 2)));
    host.remoteClose();
    deferredLoad.resolve(createCheckpoint(createNonEmptyCommand("late", 1)));
    await flushAsyncWork();

    expect(host.posted).toEqual([]);
    expect(broker.getDiagnostics()).toMatchObject({
      checkpointPersistenceFailures: 1,
      recoveryCommandsForwarded: 0,
    });
  });
});

describe("Playback Host control connection requests", () => {
  test("requires a bounded renderer request while deriving the real identity from Electron", () => {
    expect(
      parsePlaybackHostControlConnectionRequest({ connectionId: "debug-client", role: "client" }),
    ).toEqual({ connectionId: "debug-client", role: "client" });
    expect(
      parsePlaybackHostControlConnectionRequest({ connectionId: "debug", role: "replica" }),
    ).toBeNull();
    expect(
      parsePlaybackHostControlConnectionRequest({ connectionId: "", role: "host" }),
    ).toBeNull();
    expect(createOwnedPlaybackHostControlConnectionId("client", 42)).toBe("client:42");
    expect(() => createOwnedPlaybackHostControlConnectionId("host", -1)).toThrow(RangeError);
  });
});
