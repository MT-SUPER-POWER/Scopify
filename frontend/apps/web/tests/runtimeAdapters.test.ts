import { describe, expect, test } from "bun:test";

import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type DesktopBridge,
  type DesktopHostConfig,
  type DesktopIconVisibilityState,
  type DesktopPlaybackWallpaperModel,
  type AudioFeatureFrameV1,
  type PlaybackHostBridge,
  type PlaybackHostControlReceipt,
  type PlaybackHostSetRepeatModeCommand,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackHostSessionSnapshot,
  type PlaybackSessionSeed,
} from "@scopify/desktop-contract";

import { createBrowserRuntime } from "@/lib/runtime/adapters/browser";
import { createElectronRuntime } from "@/lib/runtime/adapters/electron";
import { createPlaybackHostRuntime } from "@/lib/runtime/adapters/playbackHost";
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
  discord: { applicationId: "1536959813114658836", enabled: true },
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
const PLAYBACK_HOST_SESSION: PlaybackSessionSeed = {
  intent: "play",
  quality: "lossless",
  queue: {
    historyIndex: 0,
    historyStack: [0],
    originalQueue: [
      {
        album: { artworkUrl: "https://example.test/cover.jpg", id: 7, title: "Album" },
        artists: [{ id: 3, name: "Artist" }],
        durationMs: 180_000,
        fee: 0,
        id: 1,
        publishTime: 0,
        title: "Track",
      },
    ],
    playlistId: "playlist-a",
    queue: [
      {
        album: { artworkUrl: "https://example.test/cover.jpg", id: 7, title: "Album" },
        artists: [{ id: 3, name: "Artist" }],
        durationMs: 180_000,
        fee: 0,
        id: 1,
        publishTime: 0,
        title: "Track",
      },
    ],
    queueIndex: 0,
    repeatMode: "all",
    shuffleEnabled: false,
  },
  resumePositionMs: 0,
  revision: 1,
  volume: 0.8,
};
const PLAYBACK_HOST_COMMAND: PlaybackHostReplaceSessionCommand = {
  commandId: "replace-session-1",
  protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  session: PLAYBACK_HOST_SESSION,
  type: "replace-session",
};
const PLAYBACK_HOST_RECEIPT: PlaybackHostControlReceipt = {
  commandId: PLAYBACK_HOST_COMMAND.commandId,
  protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  revision: PLAYBACK_HOST_SESSION.revision,
  status: "applied",
  type: "command-receipt",
};
const PLAYBACK_HOST_SET_REPEAT_MODE: PlaybackHostSetRepeatModeCommand = {
  commandId: "set-repeat-mode-1",
  protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  repeatMode: "one",
  type: "set-repeat-mode",
};
const PLAYBACK_HOST_SNAPSHOT: PlaybackHostSessionSnapshot = {
  protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  session: PLAYBACK_HOST_SESSION,
  type: "session-snapshot",
};

function createBridge(overrides: Partial<DesktopBridge<LyricData>> = {}): DesktopBridge<LyricData> {
  return {
    checkForUpdates: async () => UPDATE_STATE,
    clearPageCache: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    closeDesktopLyric: async () => true,
    closeDesktopPlaybackController: async () => true,
    connectAudioFeatureTransport: () => NOOP,
    connectPlaybackHostControl: () => NOOP,
    connectPlaybackTransport: () => NOOP,
    deletePageCache: async () => true,
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
    getHostConfig: async () => HOST_CONFIG,
    getBridgeInfo: async () => ({
      capabilities: [],
      desktopVersion: "1.1.0",
      electronVersion: "40.0.0",
      protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
    }),
    getLogDirectory: async () => "logs",
    getDesktopLyricPreferences: async () => null,
    getDesktopIconVisibility: async () => DESKTOP_ICON_STATE,
    getDesktopPlaybackWallpaperModel: async () => WALLPAPER_MODEL,
    getPageCache: async () => null,
    getPageCacheStats: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
    getUpdateStatus: async () => UPDATE_STATE,
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
    sendPlaybackHostControlPayload: () => false,
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

function createPlaybackHostBridge(
  overrides: Partial<PlaybackHostBridge<LyricData>> = {},
): PlaybackHostBridge<LyricData> {
  return {
    connectAudioFeatureTransport: () => NOOP,
    connectPlaybackHostControl: () => NOOP,
    connectPlaybackTransport: () => NOOP,
    getNonce: () => "host-nonce",
    publishAudioFeatureFrame: () => true,
    reportReady: NOOP,
    sendPlaybackHostControlPayload: () => false,
    sendPlaybackTransportPayload: () => true,
    setMediaPlaying: NOOP,
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
    expect(await runtime.logging.getDirectory()).toBeNull();
    expect((await runtime.updates.getStatus()).supported).toBeFalse();
    expect(runtime.navigation.navigateMainWindow("/setting")).toBeFalse();
    expect((await runtime.desktopPlaybackWallpaper.getModel()).status.state).toBe("unsupported");
    expect((await runtime.desktopPlaybackWallpaper.showController()).opened).toBeFalse();
    expect(await runtime.desktopPlaybackWallpaper.setControllerLayout("expanded")).toBeFalse();
    expect((await runtime.desktopIcons.getVisibility()).supported).toBeFalse();
    expect(runtime.audioFeature.publish(AUDIO_FEATURE_FRAME)).toBeFalse();
  });

  test("keeps playback Host control inert outside a desktop renderer", () => {
    const runtime = createBrowserRuntime();
    const payloads: string[] = [];
    const closed: string[] = [];

    const client = runtime.playbackHostControl.connectClient(
      "browser-client",
      (payload) => payloads.push(payload.type),
      () => closed.push("client"),
    );
    const host = runtime.playbackHostControl.connectHost(
      "browser-host",
      (payload) => payloads.push(payload.type),
      () => closed.push("host"),
    );

    expect(client.send(PLAYBACK_HOST_COMMAND)).toBeFalse();
    expect(client.send(PLAYBACK_HOST_SET_REPEAT_MODE)).toBeFalse();
    expect(host.send(PLAYBACK_HOST_RECEIPT)).toBeFalse();
    client.close();
    host.close();

    expect(payloads).toEqual([]);
    expect(closed).toEqual([]);
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

  test("binds the visible renderer to its client-only Playback Host control port", () => {
    const calls: string[] = [];
    const received: string[] = [];
    let closePort: () => void = NOOP;
    const runtime = createElectronRuntime(
      createBridge({
        connectPlaybackHostControl: (connectionId, onPayload, onClose) => {
          calls.push(`connect:${connectionId}`);
          onPayload(PLAYBACK_HOST_RECEIPT);
          closePort = onClose;
          return () => calls.push("unsubscribe");
        },
        sendPlaybackHostControlPayload: (payload) => {
          calls.push(`send:${payload.type}`);
          return true;
        },
      }),
    );

    const connection = runtime.playbackHostControl.connectClient(
      "main-control",
      (payload) => received.push(payload.type),
      () => calls.push("closed"),
    );

    expect(connection.send(PLAYBACK_HOST_COMMAND)).toBeTrue();
    expect(connection.send(PLAYBACK_HOST_SET_REPEAT_MODE)).toBeTrue();
    closePort();
    closePort();
    connection.close();
    expect(connection.send(PLAYBACK_HOST_COMMAND)).toBeFalse();

    expect(received).toEqual(["command-receipt"]);
    expect(calls).toEqual([
      "connect:main-control",
      "send:replace-session",
      "send:set-repeat-mode",
      "unsubscribe",
      "closed",
    ]);
    expect(() => runtime.playbackHostControl.connectHost("forbidden", NOOP, NOOP)).toThrow(
      "only supports the Playback Host control client role",
    );
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
    expect(await runtime.logging.getDirectory()).toBe("C:\\Users\\Scopify\\logs");

    expect(calls).toEqual([
      "open-login",
      "login-success",
      "cookie:MUSIC_U=abc@http://127.0.0.1:3838",
      "navigate:/setting",
      "playing:true",
      "get-log-directory",
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

describe("playback host runtime adapter", () => {
  test("composes browser, main desktop, and dedicated host renderers without widening host privileges", () => {
    expect(createRuntimeForWindow(undefined).kind).toBe("browser");
    expect(createRuntimeForWindow({ electronAPI: createBridge() }).kind).toBe("desktop");
    expect(
      createRuntimeForWindow({
        playbackHostAPI: createPlaybackHostBridge(),
      }).playbackHost.getNonce(),
    ).toBe("host-nonce");

    const mainRuntime = createRuntimeForWindow({
      electronAPI: createBridge(),
      playbackHostAPI: createPlaybackHostBridge(),
    });
    expect(mainRuntime.auth.openLoginWindow()).toBeTrue();
    expect(mainRuntime.playbackHost.getNonce()).toBeNull();
  });

  test("exposes only the fixed authority and publisher transports", () => {
    const calls: string[] = [];
    const runtime = createPlaybackHostRuntime(
      createPlaybackHostBridge({
        connectAudioFeatureTransport: (connectionId, onClose) => {
          calls.push(`audio:${connectionId}`);
          onClose();
          return NOOP;
        },
        connectPlaybackTransport: (connectionId, onPayload, onClose) => {
          calls.push(`playback:${connectionId}`);
          onPayload({ type: "request-bootstrap" });
          onClose();
          return NOOP;
        },
      }),
    );
    const payloads: string[] = [];
    const closed: string[] = [];

    runtime.playback.connect(
      "authority",
      "playback-host-authority",
      (payload) => {
        if ("type" in payload) payloads.push(payload.type);
      },
      () => closed.push("playback"),
    );
    runtime.audioFeature.connect(
      "publisher",
      "playback-host-audio",
      () => closed.push("unexpected-frame"),
      () => closed.push("audio"),
    );

    expect(runtime.isDesktop).toBeTrue();
    expect(runtime.kind).toBe("desktop");
    expect(payloads).toEqual(["request-bootstrap"]);
    expect(closed).toEqual(["playback", "audio"]);
    expect(calls).toEqual(["playback:playback-host-authority", "audio:playback-host-audio"]);
    expect(() => runtime.playback.connect("replica", "forbidden", NOOP, NOOP)).toThrow(
      "only supports the playback authority role",
    );
    expect(() => runtime.audioFeature.connect("subscriber", "forbidden", NOOP, NOOP)).toThrow(
      "only supports the audio-feature publisher role",
    );
  });

  test("binds the hidden Host to its host-only Playback Host control port", () => {
    const calls: string[] = [];
    const received: string[] = [];
    let closed = 0;
    const runtime = createPlaybackHostRuntime(
      createPlaybackHostBridge({
        connectPlaybackHostControl: (connectionId, onPayload) => {
          calls.push(`connect:${connectionId}`);
          onPayload(PLAYBACK_HOST_COMMAND);
          onPayload(PLAYBACK_HOST_SET_REPEAT_MODE);
          return () => calls.push("unsubscribe");
        },
        sendPlaybackHostControlPayload: (payload) => {
          calls.push(`send:${payload.type}`);
          return true;
        },
      }),
    );

    const connection = runtime.playbackHostControl.connectHost(
      "host-control",
      (payload) => received.push(payload.type),
      () => {
        closed += 1;
      },
    );

    expect(connection.send(PLAYBACK_HOST_RECEIPT)).toBeTrue();
    expect(connection.send(PLAYBACK_HOST_SNAPSHOT)).toBeTrue();
    connection.close();
    connection.close();
    expect(connection.send(PLAYBACK_HOST_RECEIPT)).toBeFalse();

    expect(received).toEqual(["replace-session", "set-repeat-mode"]);
    expect(closed).toBe(0);
    expect(calls).toEqual([
      "connect:host-control",
      "send:command-receipt",
      "send:session-snapshot",
      "unsubscribe",
    ]);
    expect(() => runtime.playbackHostControl.connectClient("forbidden", NOOP, NOOP)).toThrow(
      "only supports the Playback Host control host role",
    );
  });

  test("reports its nonce without acquiring unrelated desktop privileges", async () => {
    const readyNonces: string[] = [];
    const mediaPlaying: boolean[] = [];
    const runtime = createPlaybackHostRuntime(
      createPlaybackHostBridge({
        getNonce: () => "host-nonce-42",
        reportReady: (nonce) => readyNonces.push(nonce),
        setMediaPlaying: (isPlaying) => mediaPlaying.push(isPlaying),
      }),
    );

    expect(runtime.playbackHost.getNonce()).toBe("host-nonce-42");
    expect(runtime.playbackHost.reportReady("host-nonce-42")).toBeTrue();
    expect(runtime.playbackHost.reportReady("")).toBeFalse();
    runtime.media.setPlaying(true);
    runtime.media.setPlaying(false);
    expect(readyNonces).toEqual(["host-nonce-42"]);
    expect(mediaPlaying).toEqual([true, false]);
    expect(runtime.auth.openLoginWindow()).toBeFalse();
    expect(runtime.navigation.navigateMainWindow("/setting")).toBeFalse();
    expect(await runtime.logging.getDirectory()).toBeNull();
  });
});
