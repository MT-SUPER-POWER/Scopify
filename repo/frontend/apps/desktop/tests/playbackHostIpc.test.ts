import { describe, expect, test } from "bun:test";
import type { IpcMainEvent } from "electron";

import { PLAYBACK_HOST_RENDERER_READY_CHANNEL } from "@scopifymusicplayer/desktop-contract/playbackHost";

import {
  initializePlaybackHostIpc,
  type PlaybackHostIpcMain,
} from "@/main/module/playbackHost/ipc";

type ReadyListener = (event: IpcMainEvent, input: unknown) => void;

class FakeIpcMain implements PlaybackHostIpcMain {
  readonly listeners = new Map<string, ReadyListener>();
  readonly removed: Array<{ channel: string; listener: ReadyListener }> = [];

  on(channel: string, listener: ReadyListener) {
    this.listeners.set(channel, listener);
  }

  removeListener(channel: string, listener: ReadyListener) {
    this.removed.push({ channel, listener });
    if (this.listeners.get(channel) === listener) this.listeners.delete(channel);
  }

  emit(senderId: number, input: unknown) {
    this.listeners.get(PLAYBACK_HOST_RENDERER_READY_CHANNEL)?.(
      { sender: { id: senderId } } as IpcMainEvent,
      input,
    );
  }
}

class FakePlaybackHostManager {
  readonly calls: Array<{ nonce: string; senderId: number }> = [];

  constructor(
    private readonly activeSenderId = 41,
    private readonly activeNonce = "active-nonce",
  ) {}

  reportRendererReady(senderId: number, nonce: string) {
    this.calls.push({ nonce, senderId });
    return senderId === this.activeSenderId && nonce === this.activeNonce;
  }
}

describe("PlaybackHost renderer-ready IPC", () => {
  test("rejects malformed data before it reaches the manager", () => {
    const ipc = new FakeIpcMain();
    const manager = new FakePlaybackHostManager();
    const rejected: string[] = [];
    initializePlaybackHostIpc({ ipc, manager, onRejected: (message) => rejected.push(message) });

    ipc.emit(41, { nonce: "" });
    ipc.emit(41, { nonce: "x".repeat(129) });
    ipc.emit(41, { nonce: 12 });
    ipc.emit(41, null);

    expect(manager.calls).toEqual([]);
    expect(rejected).toHaveLength(4);
  });

  test("rejects a stale nonce and a report from the wrong host webContents", () => {
    const ipc = new FakeIpcMain();
    const manager = new FakePlaybackHostManager();
    const rejected: string[] = [];
    initializePlaybackHostIpc({ ipc, manager, onRejected: (message) => rejected.push(message) });

    ipc.emit(41, { nonce: "stale-nonce" });
    ipc.emit(42, { nonce: "active-nonce" });

    expect(manager.calls).toEqual([
      { nonce: "stale-nonce", senderId: 41 },
      { nonce: "active-nonce", senderId: 42 },
    ]);
    expect(rejected).toEqual([
      "Rejected unauthorized playback host renderer-ready handshake.",
      "Rejected unauthorized playback host renderer-ready handshake.",
    ]);
  });

  test("accepts the active host's current nonce without exposing a response channel", () => {
    const ipc = new FakeIpcMain();
    const manager = new FakePlaybackHostManager();
    const rejected: string[] = [];
    initializePlaybackHostIpc({ ipc, manager, onRejected: (message) => rejected.push(message) });

    ipc.emit(41, { nonce: "active-nonce" });

    expect(manager.calls).toEqual([{ nonce: "active-nonce", senderId: 41 }]);
    expect(rejected).toEqual([]);
  });

  test("removes exactly its listener when disposed", () => {
    const ipc = new FakeIpcMain();
    const manager = new FakePlaybackHostManager();
    const host = initializePlaybackHostIpc({ ipc, manager });

    host.dispose();
    host.dispose();
    ipc.emit(41, { nonce: "active-nonce" });

    expect(ipc.removed).toHaveLength(1);
    expect(ipc.removed[0]?.channel).toBe(PLAYBACK_HOST_RENDERER_READY_CHANNEL);
    expect(manager.calls).toEqual([]);
  });
});
