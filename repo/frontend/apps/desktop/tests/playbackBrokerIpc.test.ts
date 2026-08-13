import { describe, expect, mock, test } from "bun:test";
import type { BrowserWindow, IpcMainEvent } from "electron";

import {
  createOwnedPlaybackConnectionId,
  parsePlaybackConnectionRequest,
} from "@/main/module/playbackBroker/connectionRequest";

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
  startCalls = 0;
  private readonly listeners = new Map<string, PortListener[]>();

  constructor(private readonly throwOnStart = false) {}

  close() {
    if (this.closed) return;
    this.closed = true;
    this.emit("close");
  }

  off(event: string, listener: PortListener) {
    this.removeListener(event, listener);
  }

  on(event: string, listener: PortListener) {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  postMessage() {}

  removeListener(event: string, listener: PortListener) {
    const listeners = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      listeners.filter((candidate) => candidate !== listener),
    );
  }

  start() {
    this.startCalls += 1;
    if (this.throwOnStart) throw new Error("MessagePort start failed");
  }

  private emit(event: string, ...args: unknown[]) {
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
  }
}

const ipcMain = new FakeIpcMain();
mock.module("electron", () => ({ ipcMain }));

const { initializePlaybackBrokerIpc, PLAYBACK_CONNECT_CHANNEL } =
  await import("@/main/module/playbackBroker/ipc");

describe("playback broker IPC connection validation", () => {
  test("accepts only bounded role-tagged connection requests", () => {
    expect(
      parsePlaybackConnectionRequest({ connectionId: "main-authority", role: "authority" }),
    ).toEqual({ connectionId: "main-authority", role: "authority" });
    expect(
      parsePlaybackConnectionRequest({ connectionId: "desktop-lyrics", role: "replica" }),
    ).toEqual({ connectionId: "desktop-lyrics", role: "replica" });

    expect(parsePlaybackConnectionRequest(null)).toBeNull();
    expect(parsePlaybackConnectionRequest([])).toBeNull();
    expect(parsePlaybackConnectionRequest({ connectionId: "", role: "replica" })).toBeNull();
    expect(
      parsePlaybackConnectionRequest({ connectionId: "x".repeat(129), role: "replica" }),
    ).toBeNull();
    expect(
      parsePlaybackConnectionRequest({ connectionId: "desktop-lyrics", role: "publisher" }),
    ).toBeNull();
  });

  test("binds Broker connection ownership to the Electron sender", () => {
    expect(createOwnedPlaybackConnectionId("replica", 42)).toBe("replica:42");
    expect(createOwnedPlaybackConnectionId("authority", 7)).toBe("authority:7");
    expect(() => createOwnedPlaybackConnectionId("replica", -1)).toThrow("non-negative integer");
  });

  test("notifies once for each successfully registered authority transport", () => {
    const authorityWindow = createWindow(41);
    const connected: number[] = [];
    const host = initializePlaybackBrokerIpc({
      getAuthorityWindow: () => authorityWindow,
      getReplicaWindows: () => [],
      onAuthorityConnected: (senderId) => connected.push(senderId),
    });

    const firstPort = new FakeMessagePort();
    ipcMain.emit(PLAYBACK_CONNECT_CHANNEL, createConnectEvent(41, firstPort), {
      connectionId: "ignored-by-main",
      role: "authority",
    });
    const replacementPort = new FakeMessagePort();
    ipcMain.emit(PLAYBACK_CONNECT_CHANNEL, createConnectEvent(41, replacementPort), {
      connectionId: "also-ignored",
      role: "authority",
    });

    expect(firstPort.startCalls).toBe(1);
    expect(replacementPort.startCalls).toBe(1);
    expect(firstPort.closed).toBeTrue();
    expect(connected).toEqual([41, 41]);

    host.dispose();
  });

  test("does not notify when authority authorization or registration fails", () => {
    const rejections: string[] = [];
    const connected: number[] = [];
    const host = initializePlaybackBrokerIpc({
      getAuthorityWindow: () => createWindow(41),
      getReplicaWindows: () => [],
      onAuthorityConnected: (senderId) => connected.push(senderId),
      onRejected: (message) => rejections.push(message),
    });

    const unauthorizedPort = new FakeMessagePort();
    ipcMain.emit(PLAYBACK_CONNECT_CHANNEL, createConnectEvent(99, unauthorizedPort), {
      connectionId: "ignored-by-main",
      role: "authority",
    });
    const failedPort = new FakeMessagePort(true);
    ipcMain.emit(PLAYBACK_CONNECT_CHANNEL, createConnectEvent(41, failedPort), {
      connectionId: "ignored-by-main",
      role: "authority",
    });

    expect(unauthorizedPort.closed).toBeTrue();
    expect(failedPort.closed).toBeTrue();
    expect(connected).toEqual([]);
    expect(rejections).toEqual([
      "Rejected unauthorized authority playback connection from renderer 99.",
      "Failed to register authority playback connection for renderer 41.",
    ]);

    host.dispose();
  });
});

function createConnectEvent(senderId: number, port: FakeMessagePort): IpcMainEvent {
  return {
    ports: [port],
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
