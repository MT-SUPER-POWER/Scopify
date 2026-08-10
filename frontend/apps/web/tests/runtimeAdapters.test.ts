import { describe, expect, test } from "bun:test";

import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  type DesktopBridge,
  type DesktopHostConfig,
  type DesktopIconVisibilityState,
  type DesktopPlaybackWallpaperModel,
} from "@scopify/desktop-contract";

import { createBrowserRuntime } from "@/lib/runtime/adapters/browser";
import { createElectronRuntime } from "@/lib/runtime/adapters/electron";
import { openLoginWindowOrFallback } from "@/lib/runtime/login";
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
const WALLPAPER_MODEL: DesktopPlaybackWallpaperModel = {
  preferences: {
    enabled: false,
    fullscreenPolicy: "pause",
    layers: { background: true, lyrics: true },
    systemWallpaperFallback: false,
  },
  status: { reason: "disabled", state: "inactive" },
};
const DESKTOP_ICON_STATE: DesktopIconVisibilityState = {
  supported: true,
  visible: true,
};

function createBridge(overrides: Partial<DesktopBridge<LyricData>> = {}): DesktopBridge<LyricData> {
  return {
    checkForUpdates: async () => UPDATE_STATE,
    clearPageCache: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    closeDesktopLyric: async () => true,
    closeDesktopPlaybackController: async () => true,
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
      protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
    }),
    getDesktopLyricPreferences: async () => null,
    getDesktopIconVisibility: async () => DESKTOP_ICON_STATE,
    getDesktopLyricSnapshot: async () => null,
    getDesktopPlaybackWallpaperModel: async () => WALLPAPER_MODEL,
    getDesktopPlaybackWallpaperPresentation: async () => null,
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
    onDesktopPlaybackWallpaperAudioFrame: () => NOOP,
    onDesktopPlaybackWallpaperModelChanged: () => NOOP,
    onDesktopPlaybackWallpaperPresentationChanged: () => NOOP,
    onFullScreenChanged: () => NOOP,
    onNavigate: () => NOOP,
    onUpdateStatusChanged: () => NOOP,
    openLoginWindow: NOOP,
    publishDesktopLyricSnapshot: async () => null,
    publishDesktopPlaybackWallpaperAudioFrame: NOOP,
    publishDesktopPlaybackWallpaperPresentation: async () => null,
    quitAndInstallUpdate: NOOP,
    relaunchApp: NOOP,
    retryDesktopPlaybackWallpaper: async () => WALLPAPER_MODEL,
    sendAppCloseAction: NOOP,
    sendDesktopLyricCommand: NOOP,
    setDesktopPlaybackControllerLayout: async () => true,
    showDesktopPlaybackController: async () => ({ opened: true }),
    setCookie: async () => true,
    setDesktopIconVisibility: async (visible) => ({ supported: true, visible }),
    setPageCache: async () => true,
    setPlayerPlaying: NOOP,
    updateHostConfig: async (nextConfig) => nextConfig,
    updateDesktopLyricPreferences: async () => null,
    updateDesktopPlaybackWallpaperPreferences: async (update) => ({
      ...WALLPAPER_MODEL,
      preferences: {
        ...WALLPAPER_MODEL.preferences,
        ...update,
        layers: {
          ...WALLPAPER_MODEL.preferences.layers,
          ...update.layers,
        },
      },
    }),
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
    expect((await runtime.desktopPlaybackWallpaper.getModel()).status.state).toBe("unsupported");
    expect((await runtime.desktopPlaybackWallpaper.showController()).opened).toBeFalse();
    expect(await runtime.desktopPlaybackWallpaper.setControllerLayout("expanded")).toBeFalse();
    expect((await runtime.desktopIcons.getVisibility()).supported).toBeFalse();
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

describe("login window fallback", () => {
  test("does not navigate when the desktop login window opens", () => {
    const calls: string[] = [];

    expect(
      openLoginWindowOrFallback({ openLoginWindow: () => true }, () =>
        calls.push("navigate-login"),
      ),
    ).toBeTrue();
    expect(calls).toEqual([]);
  });

  test("navigates to the login page when no desktop window is available", () => {
    const calls: string[] = [];

    expect(
      openLoginWindowOrFallback({ openLoginWindow: () => false }, () =>
        calls.push("navigate-login"),
      ),
    ).toBeFalse();
    expect(calls).toEqual(["navigate-login"]);
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

  test("routes every desktop wallpaper launcher through one runtime capability", async () => {
    const calls: string[] = [];
    const bridge = createBridge({
      closeDesktopPlaybackController: async () => {
        calls.push("close-controller");
        return true;
      },
      getDesktopPlaybackWallpaperModel: async () => {
        calls.push("get-model");
        return WALLPAPER_MODEL;
      },
      retryDesktopPlaybackWallpaper: async () => {
        calls.push("retry");
        return WALLPAPER_MODEL;
      },
      showDesktopPlaybackController: async () => {
        calls.push("show-controller");
        return { opened: true };
      },
      setDesktopPlaybackControllerLayout: async (layout) => {
        calls.push(`layout:${layout}`);
        return true;
      },
      updateDesktopPlaybackWallpaperPreferences: async (update) => {
        calls.push(`configure:${String(update.enabled)}`);
        return WALLPAPER_MODEL;
      },
    });
    const runtime = createElectronRuntime(bridge);

    await runtime.desktopPlaybackWallpaper.getModel();
    await runtime.desktopPlaybackWallpaper.configure({ enabled: true });
    await runtime.desktopPlaybackWallpaper.retry();
    expect(await runtime.desktopPlaybackWallpaper.setControllerLayout("expanded")).toBeTrue();
    expect(await runtime.desktopPlaybackWallpaper.showController()).toEqual({ opened: true });
    expect(await runtime.desktopPlaybackWallpaper.closeController()).toBeTrue();

    expect(calls).toEqual([
      "get-model",
      "configure:true",
      "retry",
      "layout:expanded",
      "show-controller",
      "close-controller",
    ]);
  });

  test("routes desktop icon visibility through the desktop bridge", async () => {
    const calls: string[] = [];
    const bridge = createBridge({
      getDesktopIconVisibility: async () => {
        calls.push("get-icons");
        return DESKTOP_ICON_STATE;
      },
      setDesktopIconVisibility: async (visible) => {
        calls.push(`set-icons:${visible}`);
        return { supported: true, visible };
      },
    });
    const runtime = createElectronRuntime(bridge);

    expect(await runtime.desktopIcons.getVisibility()).toEqual(DESKTOP_ICON_STATE);
    expect(await runtime.desktopIcons.setVisibility(false)).toEqual({
      supported: true,
      visible: false,
    });
    expect(calls).toEqual(["get-icons", "set-icons:false"]);
  });
});
