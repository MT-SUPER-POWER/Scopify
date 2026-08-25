import { describe, expect, test } from "bun:test";

import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  type DesktopBridge,
  type DesktopBackendStatus,
  type DesktopHostConfig,
  type DesktopIconVisibilityState,
  type DesktopPlaybackWallpaperModel,
  type AudioFeatureFrameV1,
} from "@scopify/desktop-contract";

import { createBrowserRuntime } from "@/lib/runtime/adapters/browser";
import { MemoryBrowserCacheStorage } from "@/lib/cache/browserCacheStorage";
import { createElectronRuntime } from "@/lib/runtime/adapters/electron";
import { createRuntimeForWindow } from "@/lib/runtime";
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

class MemoryLegacyPlaybackStorage {
  readonly deleted: string[] = [];
  readonly values = new Map<string, unknown>();

  async delete(key: string) {
    this.deleted.push(key);
    this.values.delete(key);
  }

  async entries(): Promise<Array<[string, unknown]>> {
    return [...this.values] as Array<[string, unknown]>;
  }
}

const NOOP = () => undefined;
const UPDATE_STATE = { currentVersion: "1.1.0", status: "idle", supported: true } as const;
const HOST_CONFIG: DesktopHostConfig = {
  app: { closeAction: 2, devTools: false, gpuAcceleration: true },
  backend: { autoStart: false, port: 3838 },
  cache: {
    dir: "",
    page: { enabled: true, maxSizeMB: 256, searchTtlMinutes: 30, ttlMinutes: 360 },
    playback: {
      enabled: true,
      lyricTtlMinutes: 1440,
      maxEntries: 100,
      maxSizeMB: 64,
      urlTtlMinutes: 30,
    },
  },
  discord: { applicationId: "1536959813114658836", enabled: true },
  frontend: { devPort: 3000, host: "127.0.0.1" },
  logging: { format: "", keepDays: 7, level: "info", maxSizeMB: 16 },
  network: { proxyMode: "system", proxyUrl: "" },
  updater: { autoDownload: false, checkOnStartup: true },
};
const BACKEND_STATUS: DesktopBackendStatus = {
  error: null,
  host: "127.0.0.1",
  managed: false,
  origin: "http://127.0.0.1:3838",
  pid: null,
  port: 3838,
  source: null,
  state: "disabled",
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
const AUDIO_FEATURE_FRAME: AudioFeatureFrameV1 = {
  authorityId: "authority-a",
  bass: 12,
  lowMid: 24,
  mid: 36,
  power: 48,
  protocolVersion: 1,
  sampledAtMs: 100,
  sequence: 0,
  sessionId: "session-a",
  spectrum: [12, 24, 36],
  streamId: "stream-a",
  treble: 60,
  type: "audio-feature-frame",
  vocal: 42,
};
function createBridge(overrides: Partial<DesktopBridge<LyricData>> = {}): DesktopBridge<LyricData> {
  return {
    getBackendStatus: async () => BACKEND_STATUS,
    checkForUpdates: async () => UPDATE_STATE,
    clearCache: async () => ({
      page: {
        categories: [],
        dir: "cache/page",
        enabled: true,
        entryCount: 0,
        maxSizeMB: 256,
        scope: "page",
        sizeBytes: 0,
      },
      playback: {
        categories: [],
        dir: "cache/playback",
        enabled: true,
        entryCount: 0,
        maxSizeMB: 64,
        scope: "playback",
        sizeBytes: 0,
      },
      rootDir: "cache",
    }),
    clearPageCache: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    closeDesktopLyric: async () => true,
    openDesktopLyric: async () => true,
    toggleDesktopLyric: async () => true,
    closeDesktopPlaybackController: async () => true,
    connectAudioFeatureTransport: () => NOOP,
    connectPlaybackTransport: () => NOOP,
    deletePageCache: async () => true,
    deleteCache: async () => true,
    downloadUpdate: async () => UPDATE_STATE,
    enterFullScreen: NOOP,
    exitApp: NOOP,
    exitFullScreen: NOOP,
    getDiscordPresenceStatus: async () => ({
      applicationId: null,
      configured: false,
      connected: false,
      enabled: false,
      error: null,
      updatedAtMs: 0,
    }),
    testDiscordPresenceConnection: async () => ({
      applicationId: null,
      configured: false,
      connected: false,
      enabled: false,
      error: null,
      updatedAtMs: 0,
    }),
    toggleDeveloperTools: async () => true,
    getHostConfig: async () => HOST_CONFIG,
    selectDirectory: async () => null,
    getBridgeInfo: async () => ({
      capabilities: [],
      desktopVersion: "1.1.0",
      electronVersion: "40.0.0",
      protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
    }),
    getLogDirectory: async () => "logs",
    openCurrentLog: async () => true,
    openLogDirectory: async () => true,
    getDesktopLyricPreferences: async () => null,
    getDesktopIconVisibility: async () => DESKTOP_ICON_STATE,
    getDesktopPlaybackWallpaperModel: async () => WALLPAPER_MODEL,
    getPageCache: async () => null,
    getCache: async () => null,
    getCacheStats: async () => ({
      page: {
        categories: [],
        dir: "cache/page",
        enabled: true,
        entryCount: 0,
        maxSizeMB: 256,
        scope: "page",
        sizeBytes: 0,
      },
      playback: {
        categories: [],
        dir: "cache/playback",
        enabled: true,
        entryCount: 0,
        maxSizeMB: 64,
        scope: "playback",
        sizeBytes: 0,
      },
      rootDir: "cache",
    }),
    getPageCacheStats: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    getUpdateStatus: async () => UPDATE_STATE,
    getVideoExportCaptureSource: async () => null,
    loginSuccess: NOOP,
    minimizeApp: NOOP,
    navigateTo: NOOP,
    onControlAudio: () => NOOP,
    onDesktopLyricCommand: () => NOOP,
    onDesktopPlaybackWallpaperModelChanged: () => NOOP,
    onDiscordPresenceStatusChanged: () => NOOP,
    onFullScreenChanged: () => NOOP,
    onNavigate: () => NOOP,
    onUpdateStatusChanged: () => NOOP,
    onBackendStatusChanged: () => NOOP,
    openLoginWindow: NOOP,
    publishDiscordPresenceSnapshot: async () => ({
      applicationId: null,
      configured: false,
      connected: false,
      enabled: false,
      error: null,
      updatedAtMs: 0,
    }),
    publishAudioFeatureFrame: () => false,
    prepareVideoExportWindow: async () => true,
    restoreVideoExportWindow: async () => true,
    selectVideoExportFile: async () => null,
    writeVideoExportFile: async () => true,
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
    setCache: async () => true,
    setPlayerPlaying: NOOP,
    sendPlaybackTransportPayload: () => true,
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
  test("selects the desktop adapter only when the preload bridge exists", () => {
    expect(createRuntimeForWindow(undefined).kind).toBe("browser");
    expect(createRuntimeForWindow({ electronAPI: createBridge() }).kind).toBe("desktop");
  });

  test("provides a complete browser fallback without a preload bridge", async () => {
    const storage = new MemoryStorage();
    const runtime = createBrowserRuntime({ storage });

    expect(runtime.kind).toBe("browser");
    expect(runtime.isDesktop).toBeFalse();
    expect(await runtime.window.toggleDeveloperTools()).toBeFalse();
    expect(runtime.auth.openLoginWindow()).toBeFalse();
    expect(runtime.auth.completeLogin()).toBeFalse();
    expect(await runtime.logging.getDirectory()).toBeNull();
    expect(await runtime.logging.openCurrentFile()).toBeFalse();
    expect(await runtime.logging.openDirectory()).toBeFalse();
    expect((await runtime.updates.getStatus()).supported).toBeFalse();
    expect(runtime.navigation.navigateMainWindow("/setting")).toBeFalse();
    expect((await runtime.desktopPlaybackWallpaper.getModel()).status.state).toBe("unsupported");
    expect((await runtime.desktopPlaybackWallpaper.showController()).opened).toBeFalse();
    expect(await runtime.desktopPlaybackWallpaper.setControllerLayout("expanded")).toBeFalse();
    expect((await runtime.desktopIcons.getVisibility()).supported).toBeFalse();
    expect(runtime.audioFeature.publish(AUDIO_FEATURE_FRAME)).toBeFalse();
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

  test("migrates legacy IndexedDB playback data without overwriting current records", async () => {
    const storage = new MemoryStorage();
    const cacheStorage = new MemoryBrowserCacheStorage();
    const legacyPlaybackStorage = new MemoryLegacyPlaybackStorage();
    const now = 1_000_000;
    const originalDateNow = Date.now;
    Date.now = () => now;

    legacyPlaybackStorage.values.set("playback-song:42", {
      cachedAt: now - 10 * 60_000,
      lyric: { lrc: { lyric: "legacy lyric" } },
      lyricCachedAt: now - 5 * 60_000,
      url: { high: "https://legacy.example/42.mp3" },
      urlCachedAt: { high: now - 5 * 60_000 },
    });
    legacyPlaybackStorage.values.set("playback-lyric-override:42", { title: "matched" });
    legacyPlaybackStorage.values.set("playback-imported-lyric:42", { content: "imported" });
    legacyPlaybackStorage.values.set("playback-lyric-source:42", "imported");
    await cacheStorage.set("playback", "playback-play-url:42:high", {
      accessedAt: now,
      category: "play-url",
      expiresAt: now + 60_000,
      sizeBytes: 1,
      value: "https://current.example/42.mp3",
    });

    try {
      const runtime = createBrowserRuntime({ cacheStorage, legacyPlaybackStorage, storage });

      expect(
        await runtime.cache.getScoped<unknown>("playback", "playback-online-lyric:42"),
      ).toEqual({
        lrc: { lyric: "legacy lyric" },
      });
      expect(await runtime.cache.getScoped<string>("playback", "playback-play-url:42:high")).toBe(
        "https://current.example/42.mp3",
      );
      expect(
        await runtime.cache.getScoped<unknown>("playback", "playback-lyric-override:42"),
      ).toEqual({
        title: "matched",
      });
      expect(
        await runtime.cache.getScoped<unknown>("playback", "playback-imported-lyric:42"),
      ).toEqual({
        content: "imported",
      });
      expect(await runtime.cache.getScoped<string>("playback", "playback-lyric-source:42")).toBe(
        "imported",
      );
      expect(legacyPlaybackStorage.values.size).toBe(0);
      expect(storage.getItem("scopify-playback-cache-migration-v2")).toBe("complete");

      await runtime.cache.statsAll();
      expect(legacyPlaybackStorage.deleted).toEqual([
        "playback-song:42",
        "playback-lyric-override:42",
        "playback-imported-lyric:42",
        "playback-lyric-source:42",
      ]);
    } finally {
      Date.now = originalDateNow;
    }
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
  test("routes bounded audio feature transport through the desktop bridge", () => {
    const calls: string[] = [];
    const received: AudioFeatureFrameV1[] = [];
    let disconnected = false;
    const bridge = createBridge({
      connectAudioFeatureTransport: (role, connectionId, onFrame, onClose) => {
        calls.push(`connect:${role}:${connectionId}`);
        onFrame(AUDIO_FEATURE_FRAME);
        onClose();
        return () => {
          disconnected = true;
        };
      },
      publishAudioFeatureFrame: (frame) => {
        calls.push(`publish:${frame.streamId}:${frame.sequence}`);
        return true;
      },
    });
    const runtime = createElectronRuntime(bridge);

    const unsubscribe = runtime.audioFeature.connect(
      "publisher",
      "main-renderer-audio-feature-publisher",
      (frame) => received.push(frame),
      () => calls.push("closed"),
    );

    expect(runtime.audioFeature.publish(AUDIO_FEATURE_FRAME)).toBeTrue();
    unsubscribe();

    expect(received).toEqual([AUDIO_FEATURE_FRAME]);
    expect(disconnected).toBeTrue();
    expect(calls).toEqual([
      "connect:publisher:main-renderer-audio-feature-publisher",
      "closed",
      "publish:stream-a:0",
    ]);
  });

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
      getLogDirectory: async () => {
        calls.push("get-log-directory");
        return "C:\\Users\\Scopify\\logs";
      },
      openCurrentLog: async () => {
        calls.push("open-current-log");
        return true;
      },
      openLogDirectory: async () => {
        calls.push("open-log-directory");
        return true;
      },
      sendAppCloseAction: (action, remember) =>
        calls.push(`app-close:${action}:${String(remember)}`),
      selectDirectory: async (defaultPath) => {
        calls.push(`select-directory:${defaultPath ?? "none"}`);
        return "D:\\CustomCache";
      },
      setPlayerPlaying: (isPlaying) => calls.push(`playing:${isPlaying}`),
      toggleDeveloperTools: async () => {
        calls.push("toggle-developer-tools");
        return true;
      },
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
    expect(await runtime.logging.getDirectory()).toBe("C:\\Users\\Scopify\\logs");
    expect(await runtime.logging.openCurrentFile()).toBeTrue();
    expect(await runtime.logging.openDirectory()).toBeTrue();
    expect(await runtime.config.selectDirectory("C:\\DefaultCache")).toBe("D:\\CustomCache");
    expect(await runtime.window.toggleDeveloperTools()).toBeTrue();
    runtime.app.submitCloseAction("minimize", true);

    expect(calls).toEqual([
      "open-login",
      "login-success",
      "cookie:MUSIC_U=abc@http://127.0.0.1:3838",
      "navigate:/setting",
      "playing:true",
      "get-log-directory",
      "open-current-log",
      "open-log-directory",
      "select-directory:C:\\DefaultCache",
      "toggle-developer-tools",
      "app-close:minimize:true",
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

  test("routes Discord connection tests through the desktop bridge", async () => {
    const bridge = createBridge({
      testDiscordPresenceConnection: async () => ({
        applicationId: "1536959813114658836",
        configured: true,
        connected: true,
        enabled: true,
        error: null,
        updatedAtMs: 1,
      }),
    });

    await expect(createElectronRuntime(bridge).discord.testConnection()).resolves.toMatchObject({
      connected: true,
    });
  });
});
