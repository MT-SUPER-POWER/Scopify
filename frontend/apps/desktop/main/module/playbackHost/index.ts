import { randomUUID } from "node:crypto";
import type { BrowserWindowConstructorOptions } from "electron";

export type PlaybackHostState = "starting" | "ready" | "recovering" | "faulted";

export interface PlaybackHostStatus {
  attempt: number;
  authorityConnected: boolean;
  controlReady: boolean;
  diagnostic?: string;
  disposed: boolean;
  loadNonce: string | null;
  rendererFinishedLoading: boolean;
  rendererReady: boolean;
  state: PlaybackHostState;
}

export interface PlaybackHostWebContents {
  readonly id: number;
  on(event: string, listener: (...args: any[]) => void): unknown;
  once(event: string, listener: (...args: any[]) => void): unknown;
  setWindowOpenHandler(handler: () => { action: "deny" }): unknown;
}

/**
 * The deliberately narrow BrowserWindow surface the manager needs. Keeping it
 * local makes the recovery state machine runnable in a Bun unit test without
 * starting Electron.
 */
export interface PlaybackHostWindow {
  destroy(): void;
  isDestroyed(): boolean;
  on(event: "closed" | "unresponsive", listener: () => void): unknown;
  loadURL(url: string): Promise<unknown>;
  readonly webContents: PlaybackHostWebContents;
}

export interface PlaybackHostClock {
  clearTimeout(timeout: unknown): void;
  setTimeout(callback: () => void, delayMs: number): unknown;
}

export interface PlaybackHostManagerOptions {
  /** The renderer origin, e.g. http://127.0.0.1:3000 or app://-/. */
  rendererBaseUrl: string;
  /** The dedicated, least-privileged preload built as playbackHostPreload.js. */
  preloadScript: string;
  clock?: PlaybackHostClock;
  createNonce?: () => string;
  /**
   * Electron construction stays at the composition root. It makes this state
   * machine executable in Bun tests and keeps main-process policy explicit.
   */
  createWindow: (options: BrowserWindowConstructorOptions) => PlaybackHostWindow;
  icon?: BrowserWindowConstructorOptions["icon"];
  isQuitting?: () => boolean;
  maxRecoveryAttempts?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
}

export interface PlaybackHostManager {
  dispose(): void;
  getStatus(): PlaybackHostStatus;
  getWindow(): PlaybackHostWindow | null;
  reportAuthorityConnected(senderId: number): boolean;
  /** Reports that the control broker finished this Host generation's recovery barrier. */
  reportControlReady(senderId: number): boolean;
  reportRendererReady(senderId: number, nonce: string): boolean;
  start(): PlaybackHostStatus;
}

const DEFAULT_MAX_RECOVERY_ATTEMPTS = 4;
const DEFAULT_RECOVERY_DELAYS_MS = [500, 1_000, 2_000, 5_000] as const;
const DEFAULT_RETRY_BASE_DELAY_MS = DEFAULT_RECOVERY_DELAYS_MS[0];
const DEFAULT_RETRY_MAX_DELAY_MS = DEFAULT_RECOVERY_DELAYS_MS.at(-1)!;
const PLAYBACK_HOST_ROUTE = "/playback-host/";

/**
 * Owns the hidden BrowserWindow that will become the sole playback authority.
 *
 * `did-finish-load` merely proves that HTML loaded. The manager only reports
 * `ready` after the renderer repeats the per-load nonce and it has established
 * the reliable playback-authority transport. This prevents the main process
 * from switching authority on a half-initialized renderer.
 */
export function createPlaybackHostManager(
  options: PlaybackHostManagerOptions,
): PlaybackHostManager {
  const clock = options.clock ?? defaultClock;
  const createWindow = options.createWindow;
  const createNonce = options.createNonce ?? randomUUID;
  const isQuitting = options.isQuitting ?? (() => false);
  const maxRecoveryAttempts = options.maxRecoveryAttempts ?? DEFAULT_MAX_RECOVERY_ATTEMPTS;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const retryMaxDelayMs = options.retryMaxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;
  const usesDefaultRecoverySchedule =
    options.retryBaseDelayMs === undefined && options.retryMaxDelayMs === undefined;

  validateRetryOptions(maxRecoveryAttempts, retryBaseDelayMs, retryMaxDelayMs);

  let activeWindow: PlaybackHostWindow | null = null;
  let activeNonce: string | null = null;
  let authorityConnected = false;
  let controlReady = false;
  let disposed = false;
  let recoveryAttempts = 0;
  let recoveryTimer: unknown | null = null;
  let recoveryToken = 0;
  let rendererFinishedLoading = false;
  let rendererReady = false;
  let status: PlaybackHostStatus = createStatus("starting");

  function getWindow() {
    return activeWindow && !activeWindow.isDestroyed() ? activeWindow : null;
  }

  function getStatus() {
    return { ...status };
  }

  function start() {
    if (disposed || isQuitting()) return getStatus();
    if (getWindow()) return getStatus();

    cancelRecovery();
    recoveryAttempts = 0;
    createHostWindow("starting");
    return getStatus();
  }

  function reportRendererReady(senderId: number, nonce: string) {
    const window = getWindow();
    if (
      !window ||
      !rendererFinishedLoading ||
      senderId !== window.webContents.id ||
      nonce !== activeNonce
    ) {
      return false;
    }

    rendererReady = true;
    refreshStatus();
    settleReady();
    return true;
  }

  function reportAuthorityConnected(senderId: number) {
    const window = getWindow();
    if (!window || !rendererFinishedLoading || senderId !== window.webContents.id) {
      return false;
    }

    authorityConnected = true;
    refreshStatus();
    settleReady();
    return true;
  }

  function reportControlReady(senderId: number) {
    const window = getWindow();
    if (!window || !rendererFinishedLoading || senderId !== window.webContents.id) {
      return false;
    }

    controlReady = true;
    refreshStatus();
    settleReady();
    return true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelRecovery();
    detachActiveWindow();
    setStatus("faulted", "Playback host manager disposed.");
  }

  function createHostWindow(nextState: Extract<PlaybackHostState, "starting" | "recovering">) {
    if (disposed || isQuitting()) return;

    const nonce = createNonce();
    const url = createPlaybackHostUrl(options.rendererBaseUrl, nonce);
    const window = createWindow({
      autoHideMenuBar: true,
      backgroundColor: "#000000",
      focusable: false,
      frame: false,
      hasShadow: false,
      height: 1,
      icon: options.icon,
      maximizable: false,
      minimizable: false,
      movable: false,
      resizable: false,
      show: false,
      skipTaskbar: true,
      title: "Scopify Playback Host",
      width: 1,
      webPreferences: {
        autoplayPolicy: "no-user-gesture-required",
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
        preload: options.preloadScript,
        sandbox: true,
      },
    });

    activeWindow = window;
    activeNonce = nonce;
    authorityConnected = false;
    controlReady = false;
    rendererFinishedLoading = false;
    rendererReady = false;
    setStatus(nextState);

    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.once("did-finish-load", () => {
      if (activeWindow !== window || disposed || isQuitting()) return;
      rendererFinishedLoading = true;
      refreshStatus();
      settleReady();
    });
    window.webContents.on("did-fail-load", (_event, code, description) => {
      recoverFrom(window, `Playback host failed to load (${String(code)}): ${String(description)}`);
    });
    window.webContents.on("render-process-gone", (_event, details) => {
      recoverFrom(window, `Playback host renderer exited: ${describeRendererExit(details)}`);
    });
    window.on("closed", () => {
      recoverFrom(window, "Playback host window closed unexpectedly.");
    });
    window.on("unresponsive", () => {
      recoverFrom(window, "Playback host window became unresponsive.");
    });

    window.loadURL(url).catch((error: unknown) => {
      recoverFrom(window, `Playback host load rejected: ${describeError(error)}`);
    });
  }

  function settleReady() {
    if (!rendererFinishedLoading || !rendererReady || !authorityConnected || !controlReady) return;
    setStatus("ready");
  }

  function recoverFrom(window: PlaybackHostWindow, diagnostic: string) {
    if (activeWindow !== window) return;

    activeWindow = null;
    activeNonce = null;
    authorityConnected = false;
    controlReady = false;
    rendererFinishedLoading = false;
    rendererReady = false;
    if (!window.isDestroyed()) window.destroy();

    if (disposed || isQuitting()) {
      setStatus("faulted", diagnostic);
      return;
    }

    if (recoveryAttempts >= maxRecoveryAttempts) {
      setStatus("faulted", `${diagnostic} Recovery attempt limit reached.`);
      return;
    }

    recoveryAttempts += 1;
    setStatus("recovering", diagnostic);
    const retryToken = ++recoveryToken;
    const delayMs = usesDefaultRecoverySchedule
      ? DEFAULT_RECOVERY_DELAYS_MS[
          Math.min(recoveryAttempts - 1, DEFAULT_RECOVERY_DELAYS_MS.length - 1)
        ]!
      : recoveryDelayFor(recoveryAttempts, retryBaseDelayMs, retryMaxDelayMs);
    recoveryTimer = clock.setTimeout(() => {
      if (retryToken !== recoveryToken || disposed || isQuitting()) return;
      recoveryTimer = null;
      createHostWindow("recovering");
    }, delayMs);
  }

  function detachActiveWindow() {
    const window = activeWindow;
    activeWindow = null;
    activeNonce = null;
    authorityConnected = false;
    controlReady = false;
    rendererFinishedLoading = false;
    rendererReady = false;
    if (window && !window.isDestroyed()) window.destroy();
  }

  function cancelRecovery() {
    recoveryToken += 1;
    if (recoveryTimer !== null) clock.clearTimeout(recoveryTimer);
    recoveryTimer = null;
  }

  function setStatus(nextState: PlaybackHostState, diagnostic?: string) {
    status = createStatus(nextState, diagnostic);
  }

  function refreshStatus() {
    setStatus(status.state, status.diagnostic);
  }

  function createStatus(state: PlaybackHostState, diagnostic?: string): PlaybackHostStatus {
    return {
      attempt: recoveryAttempts,
      authorityConnected,
      controlReady,
      ...(diagnostic ? { diagnostic } : {}),
      disposed,
      loadNonce: activeNonce,
      rendererFinishedLoading,
      rendererReady,
      state,
    };
  }

  return {
    dispose,
    getStatus,
    getWindow,
    reportAuthorityConnected,
    reportControlReady,
    reportRendererReady,
    start,
  };
}

export function createPlaybackHostUrl(rendererBaseUrl: string, nonce: string) {
  const url = new URL(PLAYBACK_HOST_ROUTE, rendererBaseUrl);
  url.searchParams.set("hostNonce", nonce);
  return url.toString();
}

const defaultClock: PlaybackHostClock = {
  clearTimeout(timeout) {
    clearTimeout(timeout as ReturnType<typeof setTimeout>);
  },
  setTimeout(callback, delayMs) {
    const timeout = setTimeout(callback, delayMs);
    if (typeof timeout === "object" && timeout && "unref" in timeout) {
      (timeout as { unref(): void }).unref();
    }
    return timeout;
  },
};

function recoveryDelayFor(attempt: number, baseDelayMs: number, maxDelayMs: number) {
  return Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
}

function validateRetryOptions(maxAttempts: number, baseDelayMs: number, maxDelayMs: number) {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 0 || maxAttempts > 10) {
    throw new RangeError("maxRecoveryAttempts must be an integer between 0 and 10.");
  }
  if (!Number.isFinite(baseDelayMs) || baseDelayMs <= 0) {
    throw new RangeError("retryBaseDelayMs must be a positive finite number.");
  }
  if (!Number.isFinite(maxDelayMs) || maxDelayMs < baseDelayMs) {
    throw new RangeError("retryMaxDelayMs must be finite and at least retryBaseDelayMs.");
  }
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function describeRendererExit(details: unknown) {
  if (typeof details !== "object" || details === null) return String(details);
  const reason = "reason" in details ? details.reason : undefined;
  const exitCode = "exitCode" in details ? details.exitCode : undefined;
  return `reason=${String(reason)}, exitCode=${String(exitCode)}`;
}
