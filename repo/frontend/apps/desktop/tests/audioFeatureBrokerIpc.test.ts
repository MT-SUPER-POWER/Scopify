import { describe, expect, mock, test } from "bun:test";
import type { BrowserWindow, IpcMainEvent } from "electron";

import {
  createOwnedAudioFeatureConnectionId,
  parseAudioFeatureConnectionRequest,
} from "@main/capabilities/audioFeatureBroker/connectionRequest";

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
const fakeApp = { isPackaged: false, getPath: () => "" };
mock.module("electron", () => ({ ipcMain, app: fakeApp }));

const { initializeAudioFeatureBrokerIpc, AUDIO_FEATURE_CONNECT_CHANNEL } =
  await import("@main/capabilities/audioFeatureBroker/ipc");

describe("audio-feature broker IPC connection validation", () => {
  test("accepts only bounded publisher and subscriber connection requests", () => {
    expect(
      parseAudioFeatureConnectionRequest({ connectionId: "main-publisher", role: "publisher" }),
    ).toEqual({ connectionId: "main-publisher", role: "publisher" });
    expect(
      parseAudioFeatureConnectionRequest({
        connectionId: "wallpaper-subscriber",
        role: "subscriber",
      }),
    ).toEqual({ connectionId: "wallpaper-subscriber", role: "subscriber" });

    expect(parseAudioFeatureConnectionRequest(null)).toBeNull();
    expect(parseAudioFeatureConnectionRequest([])).toBeNull();
    expect(parseAudioFeatureConnectionRequest({ connectionId: "", role: "subscriber" })).toBeNull();
    expect(
      parseAudioFeatureConnectionRequest({ connectionId: "x".repeat(129), role: "subscriber" }),
    ).toBeNull();
    expect(
      parseAudioFeatureConnectionRequest({ connectionId: "wallpaper", role: "replica" }),
    ).toBeNull();
  });

  test("binds broker connection ownership to the Electron sender", () => {
    expect(createOwnedAudioFeatureConnectionId("publisher", 42)).toBe("publisher:42");
    expect(createOwnedAudioFeatureConnectionId("subscriber", 7)).toBe("subscriber:7");
    expect(() => createOwnedAudioFeatureConnectionId("subscriber", -1)).toThrow(
      "non-negative integer",
    );
  });

  test("notifies once for each successfully registered publisher transport", () => {
    const publisherWindow = createWindow(41);
    const connected: number[] = [];
    const host = initializeAudioFeatureBrokerIpc({
      getPublisherWindow: () => publisherWindow,
      getSubscriberWindows: () => [],
      onPublisherConnected: (senderId) => connected.push(senderId),
    });

    const firstPort = new FakeMessagePort();
    ipcMain.emit(AUDIO_FEATURE_CONNECT_CHANNEL, createConnectEvent(41, firstPort), {
      connectionId: "ignored-by-main",
      role: "publisher",
    });
    const replacementPort = new FakeMessagePort();
    ipcMain.emit(AUDIO_FEATURE_CONNECT_CHANNEL, createConnectEvent(41, replacementPort), {
      connectionId: "also-ignored",
      role: "publisher",
    });

    expect(firstPort.startCalls).toBe(1);
    expect(replacementPort.startCalls).toBe(1);
    expect(firstPort.closed).toBeTrue();
    expect(connected).toEqual([41, 41]);

    host.dispose();
  });

  test("does not notify when publisher authorization or registration fails", () => {
    const rejections: string[] = [];
    const connected: number[] = [];
    const host = initializeAudioFeatureBrokerIpc({
      getPublisherWindow: () => createWindow(41),
      getSubscriberWindows: () => [],
      onPublisherConnected: (senderId) => connected.push(senderId),
      onRejected: (message) => rejections.push(message),
    });

    const unauthorizedPort = new FakeMessagePort();
    ipcMain.emit(AUDIO_FEATURE_CONNECT_CHANNEL, createConnectEvent(99, unauthorizedPort), {
      connectionId: "ignored-by-main",
      role: "publisher",
    });
    const failedPort = new FakeMessagePort(true);
    ipcMain.emit(AUDIO_FEATURE_CONNECT_CHANNEL, createConnectEvent(41, failedPort), {
      connectionId: "ignored-by-main",
      role: "publisher",
    });

    expect(unauthorizedPort.closed).toBeTrue();
    expect(failedPort.closed).toBeTrue();
    expect(connected).toEqual([]);
    expect(rejections).toEqual([
      "Rejected unauthorized publisher audio-feature connection from renderer 99.",
      "Failed to register publisher audio-feature connection for renderer 41.",
    ]);

    host.dispose();
  });

  test("accepts every explicitly authorized subscriber window", () => {
    const wallpaperWindow = createWindow(52);
    const playbackControllerWindow = createWindow(53);
    const rejections: string[] = [];
    const host = initializeAudioFeatureBrokerIpc({
      getPublisherWindow: () => null,
      getSubscriberWindows: () => [wallpaperWindow, playbackControllerWindow],
      onRejected: (message) => rejections.push(message),
    });

    const controllerPort = new FakeMessagePort();
    ipcMain.emit(AUDIO_FEATURE_CONNECT_CHANNEL, createConnectEvent(53, controllerPort), {
      connectionId: "ignored-by-main",
      role: "subscriber",
    });

    expect(controllerPort.startCalls).toBe(1);
    expect(controllerPort.closed).toBeFalse();
    expect(host.getDiagnostics().subscriberIds).toEqual(["subscriber:53"]);
    expect(rejections).toEqual([]);

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
