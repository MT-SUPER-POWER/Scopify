import { describe, expect, mock, test } from "bun:test";
import type { BrowserWindow, IpcMainEvent } from "electron";

import type { PlaybackHostReplaceSessionCommand } from "@scopify/desktop-contract";
import { PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION } from "@scopify/desktop-contract";

type IpcListener = (event: IpcMainEvent, input: unknown) => void;
type PortListener = (...args: unknown[]) => void;

class FakeIpcMain {
  private readonly listeners = new Map<string, IpcListener[]>();

  emit(channel: string, event: IpcMainEvent, input: unknown) {
    for (const listener of this.listeners.get(channel) ?? []) listener(event, input);
  }

  on(channel: string, listener: IpcListener) {
    const listeners = this.listeners.get(channel) ?? [];
    listeners.push(listener);
    this.listeners.set(channel, listeners);
  }

  removeListener(channel: string, listener: IpcListener) {
    const listeners = this.listeners.get(channel);
    if (!listeners) return;
    this.listeners.set(
      channel,
      listeners.filter((candidate) => candidate !== listener),
    );
  }
}

class FakeMessagePort {
  closed = false;
  readonly posted: unknown[] = [];
  startCalls = 0;
  private readonly listeners = new Map<string, PortListener[]>();

  close() {
    if (this.closed) return;
    this.closed = true;
    this.emit("close");
  }

  once(event: string, listener: PortListener) {
    const onceListener: PortListener = (...args) => {
      this.removeListener(event, onceListener);
      listener(...args);
    };
    this.on(event, onceListener);
  }

  on(event: string, listener: PortListener) {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  postMessage(message: unknown) {
    if (this.closed) throw new Error("fake port closed");
    this.posted.push(structuredClone(message));
  }

  receive(message: unknown) {
    this.emit("message", { data: structuredClone(message) });
  }

  removeListener(event: string, listener: PortListener) {
    const listeners = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      listeners.filter((candidate) => candidate !== listener),
    );
  }

  start() {
    this.startCalls += 1;
  }

  private emit(event: string, ...args: unknown[]) {
    for (const listener of [...(this.listeners.get(event) ?? [])]) listener(...args);
  }
}

const ipcMain = new FakeIpcMain();
mock.module("electron", () => ({ ipcMain }));

const { initializePlaybackHostControlBrokerIpc, PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL } =
  await import("@/main/module/playbackHostControl/ipc");

function createCommand(): PlaybackHostReplaceSessionCommand {
  return {
    commandId: "ipc-command",
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
      revision: 1,
      volume: 0.5,
    },
    type: "replace-session",
  };
}

describe("Playback Host control broker IPC", () => {
  test("authorizes the exact client and host windows, then routes their MessagePorts", () => {
    const host = initializePlaybackHostControlBrokerIpc({
      getClientWindow: () => createWindow(11),
      getHostWindow: () => createWindow(22),
    });
    const clientPort = new FakeMessagePort();
    const hostPort = new FakeMessagePort();
    ipcMain.emit(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, createConnectEvent(11, clientPort), {
      connectionId: "renderer-debug-client",
      role: "client",
    });
    ipcMain.emit(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, createConnectEvent(22, hostPort), {
      connectionId: "renderer-debug-host",
      role: "host",
    });

    const command = createCommand();
    clientPort.receive(command);
    hostPort.receive({
      commandId: command.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      revision: command.session.revision,
      status: "applied",
      type: "command-receipt",
    });

    expect(clientPort.startCalls).toBe(1);
    expect(hostPort.startCalls).toBe(1);
    expect(hostPort.posted).toEqual([command]);
    expect(clientPort.posted).toEqual([
      {
        commandId: command.commandId,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        revision: command.session.revision,
        status: "applied",
        type: "command-receipt",
      },
    ]);
    host.dispose();
  });

  test("reports host control readiness only through the broker's settled barrier", () => {
    const ready: number[] = [];
    const host = initializePlaybackHostControlBrokerIpc({
      getClientWindow: () => createWindow(11),
      getHostWindow: () => createWindow(22),
      onHostRecoverySettled: (senderId) => ready.push(senderId),
    });
    const hostPort = new FakeMessagePort();

    ipcMain.emit(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, createConnectEvent(22, hostPort), {
      connectionId: "renderer-debug-host",
      role: "host",
    });

    expect(ready).toEqual([22]);
    host.dispose();
  });

  test("rejects malformed, multi-port, and unauthorized connections without accepting renderer-owned IDs", () => {
    const rejected: string[] = [];
    const host = initializePlaybackHostControlBrokerIpc({
      getClientWindow: () => createWindow(11),
      getHostWindow: () => createWindow(22),
      onRejected: (message) => rejected.push(message),
    });
    const unauthorizedPort = new FakeMessagePort();
    ipcMain.emit(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, createConnectEvent(91, unauthorizedPort), {
      connectionId: "spoofed",
      role: "host",
    });
    const firstMalformedPort = new FakeMessagePort();
    const secondMalformedPort = new FakeMessagePort();
    ipcMain.emit(
      PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL,
      createConnectEvent(11, firstMalformedPort, secondMalformedPort),
      { connectionId: "extra-port", role: "client" },
    );

    expect(unauthorizedPort.closed).toBeTrue();
    expect(firstMalformedPort.closed).toBeTrue();
    expect(secondMalformedPort.closed).toBeTrue();
    expect(rejected).toEqual([
      "Rejected unauthorized host Playback Host control connection from renderer 91.",
      "Rejected malformed Playback Host control transport connection.",
    ]);
    host.dispose();
  });

  test("replaces an authorized renderer port and releases it on close", () => {
    const host = initializePlaybackHostControlBrokerIpc({
      getClientWindow: () => createWindow(11),
      getHostWindow: () => createWindow(22),
    });
    const firstClientPort = new FakeMessagePort();
    const replacementClientPort = new FakeMessagePort();
    ipcMain.emit(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, createConnectEvent(11, firstClientPort), {
      connectionId: "first",
      role: "client",
    });
    ipcMain.emit(
      PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL,
      createConnectEvent(11, replacementClientPort),
      { connectionId: "replacement", role: "client" },
    );
    replacementClientPort.close();

    expect(firstClientPort.closed).toBeTrue();
    expect(host.getDiagnostics()).toMatchObject({ activeClientConnectionId: null });
    host.dispose();
  });
});

function createConnectEvent(
  senderId: number,
  port: FakeMessagePort,
  additionalPort?: FakeMessagePort,
): IpcMainEvent {
  return {
    ports: additionalPort ? [port, additionalPort] : [port],
    sender: { id: senderId },
  } as unknown as IpcMainEvent;
}

function createWindow(webContentsId: number): BrowserWindow {
  return {
    isDestroyed: () => false,
    webContents: {
      id: webContentsId,
      isDestroyed: () => false,
    },
  } as unknown as BrowserWindow;
}
