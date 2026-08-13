import { describe, expect, test } from "bun:test";
import type { BrowserWindow, IpcMainEvent } from "electron";

import { PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL } from "@scopifymusicplayer/desktop-contract/playbackHost";

import {
  initializePlaybackHostMediaPlayingIpc,
  type PlaybackHostMediaPlayingIpcMain,
  type PlaybackHostMediaPlayingListener,
} from "@/main/module/playbackHost/mediaPlayingIpc";

class FakeIpcMain implements PlaybackHostMediaPlayingIpcMain {
  readonly listeners = new Map<string, PlaybackHostMediaPlayingListener>();
  readonly removed: Array<{ channel: string; listener: PlaybackHostMediaPlayingListener }> = [];

  on(channel: string, listener: PlaybackHostMediaPlayingListener) {
    this.listeners.set(channel, listener);
  }

  removeListener(channel: string, listener: PlaybackHostMediaPlayingListener) {
    this.removed.push({ channel, listener });
    if (this.listeners.get(channel) === listener) this.listeners.delete(channel);
  }

  emit(senderId: number, input: unknown) {
    this.listeners.get(PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL)?.(
      { sender: { id: senderId } } as IpcMainEvent,
      input,
    );
  }
}

function createWindow(id: number, isDestroyed = false) {
  return {
    isDestroyed: () => isDestroyed,
    webContents: {
      id,
      isDestroyed: () => isDestroyed,
    },
  } as unknown as BrowserWindow;
}

describe("PlaybackHost media-playing IPC", () => {
  test("applies valid media state only from the active host window", () => {
    const ipc = new FakeIpcMain();
    const applied: boolean[] = [];
    const rejected: string[] = [];
    initializePlaybackHostMediaPlayingIpc({
      getPlaybackHostWindow: () => createWindow(41),
      ipc,
      onRejected: (message) => rejected.push(message),
      setMediaPlaying: (isPlaying) => applied.push(isPlaying),
    });

    ipc.emit(41, { isPlaying: true });
    ipc.emit(41, { isPlaying: false });

    expect(applied).toEqual([true, false]);
    expect(rejected).toEqual([]);
  });

  test("rejects malformed payloads and every non-host sender", () => {
    const ipc = new FakeIpcMain();
    const applied: boolean[] = [];
    const rejected: string[] = [];
    initializePlaybackHostMediaPlayingIpc({
      getPlaybackHostWindow: () => createWindow(41),
      ipc,
      onRejected: (message) => rejected.push(message),
      setMediaPlaying: (isPlaying) => applied.push(isPlaying),
    });

    ipc.emit(41, null);
    ipc.emit(41, { isPlaying: "true" });
    ipc.emit(42, { isPlaying: true });

    expect(applied).toEqual([]);
    expect(rejected).toEqual([
      "Rejected malformed playback host media-playing update.",
      "Rejected malformed playback host media-playing update.",
      "Rejected unauthorized playback host media-playing update.",
    ]);
  });

  test("rejects reports when the Host has been destroyed or is unavailable", () => {
    const ipc = new FakeIpcMain();
    const applied: boolean[] = [];
    const rejected: string[] = [];
    let host: BrowserWindow | null = createWindow(41, true);
    initializePlaybackHostMediaPlayingIpc({
      getPlaybackHostWindow: () => host,
      ipc,
      onRejected: (message) => rejected.push(message),
      setMediaPlaying: (isPlaying) => applied.push(isPlaying),
    });

    ipc.emit(41, { isPlaying: true });
    host = null;
    ipc.emit(41, { isPlaying: false });

    expect(applied).toEqual([]);
    expect(rejected).toEqual([
      "Rejected unauthorized playback host media-playing update.",
      "Rejected unauthorized playback host media-playing update.",
    ]);
  });

  test("removes only its listener when disposed", () => {
    const ipc = new FakeIpcMain();
    const applied: boolean[] = [];
    const host = initializePlaybackHostMediaPlayingIpc({
      getPlaybackHostWindow: () => createWindow(41),
      ipc,
      setMediaPlaying: (isPlaying) => applied.push(isPlaying),
    });

    host.dispose();
    host.dispose();
    ipc.emit(41, { isPlaying: true });

    expect(ipc.removed).toHaveLength(1);
    expect(ipc.removed[0]?.channel).toBe(PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL);
    expect(applied).toEqual([]);
  });
});
