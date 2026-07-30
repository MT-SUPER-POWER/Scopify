import { describe, expect, test } from "bun:test";

import type { DesktopBridge, DesktopHostConfig } from "@scopify/desktop-contract";

import { createBrowserRuntime } from "@/lib/runtime/adapters/browser";
import { createElectronRuntime } from "@/lib/runtime/adapters/electron";
import type { LyricData } from "@/types/lyrics";

class MemoryStorage {
  readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const NOOP = () => undefined;
const UPDATE_STATE = { currentVersion: "1.1.0", status: "idle", supported: true } as const;
const HOST_CONFIG: DesktopHostConfig = {
  app: { closeAction: 2, devTools: false, gpuAcceleration: true },
  cache: {
    dir: "",
    enabled: true,
    maxSizeMB: 256,
    pageTtlMinutes: 360,
    searchTtlMinutes: 30,
  },
  frontend: { devPort: 3000, host: "127.0.0.1" },
  logging: { format: "", keepDays: 7, level: "info" },
  network: { proxyMode: "system", proxyUrl: "" },
  updater: { autoDownload: false, checkOnStartup: true },
};

function createBridge(overrides: Partial<DesktopBridge<LyricData>> = {}): DesktopBridge<LyricData> {
  return {
    checkForUpdates: async () => UPDATE_STATE,
    clearPageCache: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    closeDesktopLyric: async () => true,
    deletePageCache: async () => true,
    downloadUpdate: async () => UPDATE_STATE,
    enterFullScreen: NOOP,
    exitApp: NOOP,
    exitFullScreen: NOOP,
    getHostConfig: async () => HOST_CONFIG,
    getBridgeInfo: async () => ({
      capabilities: [],
      desktopVersion: "1.1.0",
      electronVersion: "40.0.0",
      protocolVersion: 1,
    }),
    getDesktopLyricPreferences: async () => null,
    getDesktopLyricSnapshot: async () => null,
    getPageCache: async () => null,
    getPageCacheStats: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    getUpdateStatus: async () => UPDATE_STATE,
    loginSuccess: NOOP,
    minimizeApp: NOOP,
    navigateTo: NOOP,
    onAppCloseRequested: () => NOOP,
    onControlAudio: () => NOOP,
    onDesktopLyricCommand: () => NOOP,
    onDesktopLyricSnapshot: () => NOOP,
    onFullScreenChanged: () => NOOP,
    onNavigate: () => NOOP,
    onUpdateStatusChanged: () => NOOP,
    openLoginWindow: NOOP,
    publishDesktopLyricSnapshot: async () => null,
    quitAndInstallUpdate: NOOP,
    relaunchApp: NOOP,
    sendAppCloseAction: NOOP,
    sendDesktopLyricCommand: NOOP,
    setCookie: async () => true,
    setPageCache: async () => true,
    setPlayerPlaying: NOOP,
    updateHostConfig: async (nextConfig) => nextConfig,
    updateDesktopLyricPreferences: async () => null,
    writeLog: async () => true,
    ...overrides,
  };
}

describe("browser runtime adapter", () => {
  test("provides a complete browser fallback without a preload bridge", async () => {
    const storage = new MemoryStorage();
    const runtime = createBrowserRuntime({ storage });

    expect(runtime.kind).toBe("browser");
    expect(runtime.isDesktop).toBeFalse();
    expect(runtime.auth.openLoginWindow()).toBeFalse();
    expect(runtime.auth.completeLogin()).toBeFalse();
    expect((await runtime.updates.getStatus()).supported).toBeFalse();
    expect(runtime.navigation.navigateMainWindow("/setting")).toBeFalse();
  });

  test("owns browser cache expiry and namespace invalidation", async () => {
    const storage = new MemoryStorage();
    const runtime = createBrowserRuntime({ storage });

    await runtime.cache.set("album:1", { title: "one" }, 60_000);
    await runtime.cache.set("album:2", { title: "two" }, 60_000);
    expect(await runtime.cache.get<{ title: string }>("album:1")).toEqual({ title: "one" });
    expect((await runtime.cache.stats()).entryCount).toBe(2);

    await runtime.cache.delete("album");
    expect(await runtime.cache.get("album:1")).toBeNull();
    expect(await runtime.cache.get("album:2")).toBeNull();

    await runtime.cache.set("expired", "value", -1);
    expect(await runtime.cache.get("expired")).toBeNull();
  });

  test("persists the music cookie through the browser adapter", async () => {
    const document = {
      addEventListener: NOOP,
      cookie: "",
      documentElement: { requestFullscreen: async () => undefined },
      exitFullscreen: async () => undefined,
      fullscreenElement: null,
      removeEventListener: NOOP,
    };
    const runtime = createBrowserRuntime({ document });

    expect(
      await runtime.auth.persistMusicCookie("MUSIC_U=abc123; __csrf=secret", "http://localhost"),
    ).toBeTrue();
    expect(document.cookie).toContain("MUSIC_U=abc123");
    expect(document.cookie).not.toContain("__csrf");
  });
});

describe("electron runtime adapter", () => {
  test("translates intent-level calls to the preload bridge", async () => {
    const calls: string[] = [];
    const bridge = createBridge({
      loginSuccess: () => calls.push("login-success"),
      navigateTo: (path) => calls.push(`navigate:${path}`),
      openLoginWindow: () => calls.push("open-login"),
      setCookie: async (cookie, origin) => {
        calls.push(`cookie:${cookie}@${origin}`);
        return true;
      },
      setPlayerPlaying: (isPlaying) => calls.push(`playing:${isPlaying}`),
    });
    const runtime = createElectronRuntime(bridge);

    expect(runtime.isDesktop).toBeTrue();
    expect(runtime.auth.openLoginWindow()).toBeTrue();
    expect(runtime.auth.completeLogin()).toBeTrue();
    expect(
      await runtime.auth.persistMusicCookie("MUSIC_U=abc", "http://127.0.0.1:3838"),
    ).toBeTrue();
    expect(runtime.navigation.navigateMainWindow("/setting")).toBeTrue();
    runtime.media.setPlaying(true);

    expect(calls).toEqual([
      "open-login",
      "login-success",
      "cookie:MUSIC_U=abc@http://127.0.0.1:3838",
      "navigate:/setting",
      "playing:true",
    ]);
  });

  test("preserves bridge subscription cleanup across the seam", () => {
    let subscribed = false;
    let unsubscribed = false;
    const bridge = createBridge({
      onNavigate: (callback) => {
        subscribed = true;
        callback("/album?id=1");
        return () => {
          unsubscribed = true;
        };
      },
    });
    const runtime = createElectronRuntime(bridge);
    const paths: string[] = [];

    const unsubscribe = runtime.navigation.onNavigate((path) => paths.push(path));
    unsubscribe();

    expect(subscribed).toBeTrue();
    expect(paths).toEqual(["/album?id=1"]);
    expect(unsubscribed).toBeTrue();
  });
});
