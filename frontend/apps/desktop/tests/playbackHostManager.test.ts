import { describe, expect, test } from "bun:test";
import type { BrowserWindowConstructorOptions } from "electron";

import {
  createPlaybackHostManager,
  type PlaybackHostClock,
  type PlaybackHostWebContents,
  type PlaybackHostWindow,
} from "@/main/module/playbackHost";

type Listener = (...args: any[]) => void;

class FakeWebContents implements PlaybackHostWebContents {
  readonly listeners = new Map<string, Listener[]>();
  readonly onceListeners = new Map<string, Listener[]>();
  windowOpenHandler: (() => { action: "deny" }) | null = null;

  constructor(readonly id: number) {}

  on(event: string, listener: Listener) {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  once(event: string, listener: Listener) {
    const listeners = this.onceListeners.get(event) ?? [];
    listeners.push(listener);
    this.onceListeners.set(event, listeners);
  }

  setWindowOpenHandler(handler: () => { action: "deny" }) {
    this.windowOpenHandler = handler;
  }

  emit(event: string, ...args: unknown[]) {
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
    const onceListeners = this.onceListeners.get(event) ?? [];
    this.onceListeners.delete(event);
    for (const listener of onceListeners) listener(...args);
  }
}

class FakePlaybackHostWindow implements PlaybackHostWindow {
  destroyed = false;
  readonly events = new Map<string, Listener[]>();
  readonly loadedUrls: string[] = [];

  constructor(
    readonly webContents: FakeWebContents,
    readonly options: BrowserWindowConstructorOptions,
  ) {}

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.emit("closed");
  }

  isDestroyed() {
    return this.destroyed;
  }

  loadURL(url: string) {
    this.loadedUrls.push(url);
    return Promise.resolve();
  }

  on(event: "closed" | "unresponsive", listener: () => void) {
    const listeners = this.events.get(event) ?? [];
    listeners.push(listener);
    this.events.set(event, listeners);
  }

  emit(event: string, ...args: unknown[]) {
    for (const listener of this.events.get(event) ?? []) listener(...args);
  }
}

class FakeWindowFactory {
  readonly options: BrowserWindowConstructorOptions[] = [];
  readonly windows: FakePlaybackHostWindow[] = [];

  create = (options: BrowserWindowConstructorOptions) => {
    const window = new FakePlaybackHostWindow(
      new FakeWebContents(this.windows.length + 100),
      options,
    );
    this.options.push(options);
    this.windows.push(window);
    return window;
  };
}

class ManualClock implements PlaybackHostClock {
  readonly delays: number[] = [];
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();

  clearTimeout(timeout: unknown) {
    this.callbacks.delete(timeout as number);
  }

  runNext() {
    const scheduled = [...this.callbacks.entries()].sort(([left], [right]) => left - right)[0];
    if (!scheduled) throw new Error("No recovery callback is scheduled.");
    this.callbacks.delete(scheduled[0]);
    scheduled[1]();
  }

  setTimeout(callback: () => void, delayMs: number) {
    const id = this.nextId++;
    this.delays.push(delayMs);
    this.callbacks.set(id, callback);
    return id;
  }

  get pendingCount() {
    return this.callbacks.size;
  }
}

function createManager(
  overrides: {
    clock?: ManualClock;
    factory?: FakeWindowFactory;
    isQuitting?: () => boolean;
    maxRecoveryAttempts?: number;
    retryBaseDelayMs?: number;
    retryMaxDelayMs?: number;
  } = {},
) {
  const factory = overrides.factory ?? new FakeWindowFactory();
  const manager = createPlaybackHostManager({
    clock: overrides.clock,
    createNonce: () => `nonce-${factory.windows.length + 1}`,
    createWindow: factory.create,
    isQuitting: overrides.isQuitting,
    maxRecoveryAttempts: overrides.maxRecoveryAttempts,
    preloadScript: "/runtime/playbackHostPreload.js",
    rendererBaseUrl: "http://127.0.0.1:3000",
    ...(overrides.retryBaseDelayMs === undefined
      ? {}
      : { retryBaseDelayMs: overrides.retryBaseDelayMs }),
    ...(overrides.retryMaxDelayMs === undefined
      ? {}
      : { retryMaxDelayMs: overrides.retryMaxDelayMs }),
  });
  return { factory, manager };
}

describe("PlaybackHost manager", () => {
  test("creates a parentless, hidden, least-privileged playback host with a per-load nonce", () => {
    const { factory, manager } = createManager();

    manager.start();

    expect(factory.windows).toHaveLength(1);
    const options = factory.options[0];
    expect(options).not.toHaveProperty("parent");
    expect(options).toMatchObject({
      focusable: false,
      frame: false,
      height: 1,
      minimizable: false,
      show: false,
      skipTaskbar: true,
      width: 1,
      webPreferences: {
        autoplayPolicy: "no-user-gesture-required",
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
        preload: "/runtime/playbackHostPreload.js",
        sandbox: true,
      },
    });
    expect(factory.windows[0].webContents.windowOpenHandler?.()).toEqual({ action: "deny" });
    expect(factory.windows[0].loadedUrls[0]).toBe(
      "http://127.0.0.1:3000/playback-host/?hostNonce=nonce-1",
    );
  });

  test("becomes ready only after authority, renderer, and control recovery gates complete", () => {
    const { factory, manager } = createManager();
    manager.start();
    const window = factory.windows[0];

    expect(manager.reportRendererReady(window.webContents.id, "nonce-1")).toBeFalse();
    window.webContents.emit("did-finish-load");
    expect(manager.reportRendererReady(window.webContents.id + 1, "nonce-1")).toBeFalse();
    expect(manager.reportRendererReady(window.webContents.id, "wrong-nonce")).toBeFalse();
    expect(manager.reportAuthorityConnected(window.webContents.id)).toBeTrue();
    expect(manager.getStatus()).toMatchObject({
      authorityConnected: true,
      controlReady: false,
      rendererFinishedLoading: true,
      rendererReady: false,
      state: "starting",
    });
    expect(manager.reportRendererReady(window.webContents.id, "nonce-1")).toBeTrue();
    expect(manager.getStatus()).toMatchObject({
      authorityConnected: true,
      controlReady: false,
      rendererFinishedLoading: true,
      rendererReady: true,
      state: "starting",
    });
    expect(manager.reportControlReady(window.webContents.id + 1)).toBeFalse();
    expect(manager.reportControlReady(window.webContents.id)).toBeTrue();
    expect(manager.getStatus().state).toBe("ready");
  });

  test("also accepts the renderer-ready IPC before authority connects", () => {
    const { factory, manager } = createManager();
    manager.start();
    const window = factory.windows[0];

    window.webContents.emit("did-finish-load");
    expect(manager.reportRendererReady(window.webContents.id, "nonce-1")).toBeTrue();
    expect(manager.getStatus().state).toBe("starting");
    expect(manager.reportControlReady(window.webContents.id)).toBeTrue();
    expect(manager.getStatus().state).toBe("starting");
    expect(manager.reportAuthorityConnected(window.webContents.id)).toBeTrue();
    expect(manager.getStatus().state).toBe("ready");
  });

  test("recovers an unresponsive host with the bounded default schedule before faulting", () => {
    const clock = new ManualClock();
    const { factory, manager } = createManager({ clock });
    manager.start();

    factory.windows[0].emit("unresponsive");
    expect(manager.getStatus()).toMatchObject({ attempt: 1, state: "recovering" });
    expect(clock.delays).toEqual([500]);

    clock.runNext();
    expect(factory.windows).toHaveLength(2);
    factory.windows[1].webContents.emit("render-process-gone", null, {
      exitCode: 9,
      reason: "crashed",
    });
    expect(manager.getStatus()).toMatchObject({ attempt: 2, state: "recovering" });
    expect(clock.delays).toEqual([500, 1_000]);

    clock.runNext();
    expect(factory.windows).toHaveLength(3);
    factory.windows[2].webContents.emit("did-fail-load", null, -2, "net::ERR_FAILED");
    expect(manager.getStatus()).toMatchObject({ attempt: 3, state: "recovering" });
    expect(clock.delays).toEqual([500, 1_000, 2_000]);

    clock.runNext();
    expect(factory.windows).toHaveLength(4);
    factory.windows[3].emit("closed");
    expect(manager.getStatus()).toMatchObject({ attempt: 4, state: "recovering" });
    expect(clock.delays).toEqual([500, 1_000, 2_000, 5_000]);

    clock.runNext();
    expect(factory.windows).toHaveLength(5);
    factory.windows[4].emit("unresponsive");
    expect(manager.getStatus()).toMatchObject({ attempt: 4, state: "faulted" });
    expect(clock.pendingCount).toBe(0);
  });

  test("does not recover after disposal or while the app is quitting", () => {
    const clock = new ManualClock();
    const { factory, manager } = createManager({ clock });
    manager.start();
    manager.dispose();
    expect(factory.windows[0].destroyed).toBeTrue();
    expect(clock.pendingCount).toBe(0);

    let quitting = false;
    const quittingClock = new ManualClock();
    const quittingManager = createManager({
      clock: quittingClock,
      isQuitting: () => quitting,
    });
    quittingManager.manager.start();
    quitting = true;
    quittingManager.factory.windows[0].webContents.emit("did-fail-load", null, -2, "shutdown");
    expect(quittingManager.manager.getStatus().state).toBe("faulted");
    expect(quittingClock.pendingCount).toBe(0);
  });
});
