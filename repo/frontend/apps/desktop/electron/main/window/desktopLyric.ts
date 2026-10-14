import {
  app,
  BrowserWindow,
  ipcMain,
  powerSaveBlocker,
  screen,
  type IpcMainInvokeEvent,
} from "electron";
import fs from "node:fs";
import { join } from "node:path";

import type {
  DesktopLyricCommand,
  DesktopLyricInteractiveRect,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
} from "@scopify/desktop-contract";

import { __iconWindow, __preloadScript } from "@main/constants";
import { windowLog } from "@main/utils/logger";
import { getTrayWindow } from "@main/window/tray";

const DESKTOP_LYRIC_ROUTE = "/desktop-lyrics";
const PREFERENCES_FILE = "desktop-lyric.json";

const DEFAULT_PREFERENCES: DesktopLyricPreferences = {
  alwaysOnTop: true,
  clickThrough: false,
  enabled: false,
  preventSleepOnPlayback: true,
  showSecondaryLyric: true,
  skipTaskbar: true,
};

let mainWindow: BrowserWindow | null = null;
let desktopLyricWindow: BrowserWindow | null = null;
let desktopLyricUrl: null | string = null;
let preferences: DesktopLyricPreferences | null = null;
let ipcRegistered = false;
let powerSaveBlockerId: number | null = null;
let isPlaybackPlaying = false;
// 鼠标穿透开启时，光标停在渲染进程上报的可交互区域（工具栏）内会临时把窗口切回可交互，让用户能点到解锁按钮。
let interactiveRects: DesktopLyricInteractiveRect[] = [];
let isMouseCaptured = false;
let hitTestTimer: ReturnType<typeof setInterval> | null = null;
const HIT_TEST_INTERVAL_MS = 50;
const MAX_INTERACTIVE_RECTS = 8;

export interface DesktopLyricCompanionOptions {
  rendererBaseUrl: string;
}

export function initializeDesktopLyricCompanion(
  nextMainWindow: BrowserWindow,
  options: DesktopLyricCompanionOptions,
) {
  mainWindow = nextMainWindow;
  desktopLyricUrl = new URL(DESKTOP_LYRIC_ROUTE, options.rendererBaseUrl).toString();
  registerIpcHandlers();
}

export function getDesktopLyricWindow() {
  return isWindowAlive(desktopLyricWindow) ? desktopLyricWindow : null;
}

function applyMainWindowCommand(command: DesktopLyricCommand) {
  if (!isWindowAlive(mainWindow)) return false;

  switch (command.type) {
    case "resize-main-window":
      mainWindow.setSize(Math.round(command.width), Math.round(command.height));
      return true;
    case "set-main-window-always-on-top":
      mainWindow.setAlwaysOnTop(command.enabled, "floating");
      return true;
    case "set-main-window-click-through":
      mainWindow.setIgnoreMouseEvents(command.enabled, { forward: command.enabled });
      return true;
    default:
      return false;
  }
}

function applyMouseEventPolicy(window: BrowserWindow) {
  const ignore = getPreferences().clickThrough && !isMouseCaptured;
  window.setIgnoreMouseEvents(ignore, { forward: ignore });
}

function isCursorOverInteractiveRegion(window: BrowserWindow) {
  const cursor = screen.getCursorScreenPoint();
  const bounds = window.getContentBounds();
  const x = cursor.x - bounds.x;
  const y = cursor.y - bounds.y;
  return interactiveRects.some(
    (rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height,
  );
}

function syncMouseCapture() {
  if (!isWindowAlive(desktopLyricWindow)) return;
  const next = getPreferences().clickThrough && isCursorOverInteractiveRegion(desktopLyricWindow);
  if (next === isMouseCaptured) return;
  isMouseCaptured = next;
  applyMouseEventPolicy(desktopLyricWindow);
}

function updateHitTestTimer() {
  const needed = isWindowAlive(desktopLyricWindow) && getPreferences().clickThrough;
  if (needed && hitTestTimer === null) {
    hitTestTimer = setInterval(syncMouseCapture, HIT_TEST_INTERVAL_MS);
  } else if (!needed && hitTestTimer !== null) {
    clearInterval(hitTestTimer);
    hitTestTimer = null;
    isMouseCaptured = false;
  }
}

function applyPreferences(window: BrowserWindow) {
  const currentPreferences = getPreferences();
  window.setAlwaysOnTop(currentPreferences.alwaysOnTop, "floating");
  window.setSkipTaskbar(currentPreferences.skipTaskbar);
  updateHitTestTimer();
  syncMouseCapture();
  applyMouseEventPolicy(window);
}

function updatePowerSaveBlocker() {
  const currentPreferences = getPreferences();
  const shouldPreventSleep =
    Boolean(currentPreferences.preventSleepOnPlayback) &&
    isWindowAlive(desktopLyricWindow) &&
    isPlaybackPlaying;

  if (shouldPreventSleep) {
    if (powerSaveBlockerId === null || !powerSaveBlocker.isStarted(powerSaveBlockerId)) {
      powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
    }
  } else {
    if (powerSaveBlockerId !== null) {
      if (powerSaveBlocker.isStarted(powerSaveBlockerId)) {
        powerSaveBlocker.stop(powerSaveBlockerId);
      }
      powerSaveBlockerId = null;
    }
  }
}

export function onDesktopLyricPlaybackStateChanged(isPlaying: boolean) {
  isPlaybackPlaying = isPlaying;
  updatePowerSaveBlocker();
}

function closeDesktopLyricWindow() {
  if (!isWindowAlive(desktopLyricWindow)) return false;
  desktopLyricWindow.destroy();
  desktopLyricWindow = null;
  updateHitTestTimer();
  updatePowerSaveBlocker();
  return true;
}

function getPreferences(): DesktopLyricPreferences {
  preferences ??= readPreferences();
  return {
    ...preferences,
    enabled: isWindowAlive(desktopLyricWindow),
  };
}

function notifyPreferencesChanged() {
  const currentPreferences = getPreferences();
  for (const window of [mainWindow, desktopLyricWindow, getTrayWindow()]) {
    if (isWindowAlive(window)) {
      window.webContents.send("desktop-lyric:preferences", currentPreferences);
    }
  }
}

function isDesktopLyricCommand(value: unknown): value is DesktopLyricCommand {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "resize-desktop-lyric-window":
    case "resize-main-window":
      return (
        isFiniteNonNegativeNumber(value.width) &&
        value.width > 0 &&
        isFiniteNonNegativeNumber(value.height) &&
        value.height > 0
      );
    case "set-desktop-lyric-interactive-region":
      return (
        Array.isArray(value.rects) &&
        value.rects.length <= MAX_INTERACTIVE_RECTS &&
        value.rects.every(isInteractiveRect)
      );
    case "set-main-window-always-on-top":
    case "set-main-window-click-through":
    case "set-stage-transparent":
      return typeof value.enabled === "boolean";
    case "set-stage-border-visible":
    case "set-stage-controls-visible":
      return typeof value.visible === "boolean";
    default:
      return false;
  }
}

function isInteractiveRect(value: unknown): value is DesktopLyricInteractiveRect {
  return (
    isRecord(value) &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    isFiniteNonNegativeNumber(value.width) &&
    isFiniteNonNegativeNumber(value.height)
  );
}

function isDesktopLyricPreferencesUpdate(value: unknown): value is DesktopLyricPreferencesUpdate {
  if (!isRecord(value)) return false;

  const keys = Object.keys(value);
  if (keys.length === 0) return false;

  const validKeys = new Set([
    "alwaysOnTop",
    "clickThrough",
    "enabled",
    "preventSleepOnPlayback",
    "showSecondaryLyric",
    "skipTaskbar",
  ]);

  return keys.every((key) => validKeys.has(key) && typeof value[key] === "boolean");
}

function isDesktopLyricWindowSender(event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  return isWindowAlive(desktopLyricWindow) && event.sender.id === desktopLyricWindow.webContents.id;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isMainWindowSender(event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  return isWindowAlive(mainWindow) && event.sender.id === mainWindow.webContents.id;
}

function isAuthorizedCompanionSender(event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  if (isMainWindowSender(event)) return true;
  const tray = getTrayWindow();
  return isWindowAlive(tray) && event.sender.id === tray.webContents.id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWindowAlive(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed();
}

function preferencesPath() {
  return join(app.getPath("userData"), PREFERENCES_FILE);
}

function readPreferences(): DesktopLyricPreferences {
  try {
    const raw = fs.readFileSync(preferencesPath(), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...DEFAULT_PREFERENCES };

    return {
      alwaysOnTop:
        typeof parsed.alwaysOnTop === "boolean"
          ? parsed.alwaysOnTop
          : DEFAULT_PREFERENCES.alwaysOnTop,
      clickThrough:
        typeof parsed.clickThrough === "boolean"
          ? parsed.clickThrough
          : DEFAULT_PREFERENCES.clickThrough,
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_PREFERENCES.enabled,
      preventSleepOnPlayback:
        typeof parsed.preventSleepOnPlayback === "boolean"
          ? parsed.preventSleepOnPlayback
          : DEFAULT_PREFERENCES.preventSleepOnPlayback,
      showSecondaryLyric:
        typeof parsed.showSecondaryLyric === "boolean"
          ? parsed.showSecondaryLyric
          : DEFAULT_PREFERENCES.showSecondaryLyric,
      skipTaskbar:
        typeof parsed.skipTaskbar === "boolean"
          ? parsed.skipTaskbar
          : DEFAULT_PREFERENCES.skipTaskbar,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      windowLog.warn("[desktop-lyric] failed to read preferences", error);
    }
    return { ...DEFAULT_PREFERENCES };
  }
}

function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle("desktop-lyric:open", (event) => {
    if (!isAuthorizedCompanionSender(event)) {
      rejectUnexpectedSender("desktop-lyric:open");
      return false;
    }
    showDesktopLyricWindow();
    return true;
  });

  ipcMain.handle("desktop-lyric:toggle", (event) => {
    if (!isAuthorizedCompanionSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:toggle");
      return false;
    }
    return toggleDesktopLyricWindow();
  });

  ipcMain.handle("desktop-lyric:close", (event) => {
    if (!isAuthorizedCompanionSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:close");
      return false;
    }
    return closeDesktopLyricWindow();
  });

  ipcMain.handle("desktop-lyric:get-preferences", (event) => {
    if (!isMainWindowSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:get-preferences");
      return null;
    }
    return getPreferences();
  });

  ipcMain.handle("desktop-lyric:update-preferences", (event, update: unknown) => {
    if (!isMainWindowSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:update-preferences");
      return null;
    }
    if (!isDesktopLyricPreferencesUpdate(update)) {
      windowLog.warn("[desktop-lyric] rejected invalid preferences update");
      return null;
    }
    return updatePreferences(update);
  });

  ipcMain.on("desktop-lyric:command", (event, command: unknown) => {
    if (!isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:command");
      return;
    }
    if (!isDesktopLyricCommand(command)) {
      windowLog.warn("[desktop-lyric] rejected invalid command");
      return;
    }
    if (command.type === "resize-desktop-lyric-window") {
      if (!isWindowAlive(desktopLyricWindow)) return;
      const current = desktopLyricWindow.getBounds();
      const area = screen.getDisplayMatching(current).workArea;
      const width = Math.min(area.width, Math.max(240, Math.round(command.width)));
      const height = Math.min(area.height, Math.max(70, Math.round(command.height)));
      if (width !== current.width || height !== current.height)
        desktopLyricWindow.setBounds({
          width,
          height,
          x: Math.round(
            Math.max(
              area.x,
              Math.min(current.x + (current.width - width) / 2, area.x + area.width - width),
            ),
          ),
          y: Math.max(
            area.y,
            Math.min(current.y + current.height - height, area.y + area.height - height),
          ),
        });
      return;
    }
    if (command.type === "set-desktop-lyric-interactive-region") {
      interactiveRects = command.rects;
      syncMouseCapture();
      return;
    }
    if (applyMainWindowCommand(command)) return;
    if (isWindowAlive(mainWindow)) {
      mainWindow.webContents.send("desktop-lyric:command", command);
    }
  });
}

function rejectUnexpectedSender(channel: string) {
  windowLog.warn(`[desktop-lyric] rejected IPC from an unexpected renderer: ${channel}`);
}

function savePreferences(nextPreferences: DesktopLyricPreferences) {
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(preferencesPath(), JSON.stringify(nextPreferences), "utf-8");
  } catch (error) {
    windowLog.error("[desktop-lyric] failed to save preferences", error);
  }
}

function showDesktopLyricWindow() {
  if (isWindowAlive(desktopLyricWindow)) {
    desktopLyricWindow.showInactive();
    return desktopLyricWindow;
  }

  if (!desktopLyricUrl) {
    throw new Error("Desktop lyric companion was not initialized before opening.");
  }

  desktopLyricWindow = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    frame: false,
    hasShadow: false,
    height: 150,
    icon: __iconWindow,
    minHeight: 70,
    minWidth: 240,
    resizable: false,
    show: false,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
    },
    width: 892,
  });

  isMouseCaptured = false;
  interactiveRects = [];
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  desktopLyricWindow.setPosition(
    Math.round(area.x + (area.width - 892) / 2),
    Math.round(area.y + area.height - 180),
  );
  applyPreferences(desktopLyricWindow);

  desktopLyricWindow.once("ready-to-show", () => {
    desktopLyricWindow?.showInactive();
    notifyPreferencesChanged();
    updatePowerSaveBlocker();
  });

  desktopLyricWindow.webContents.on("did-fail-load", (_event, code, desc, validatedUrl) => {
    windowLog.error("[desktop-lyric] companion failed to load", { code, desc, validatedUrl });
  });

  desktopLyricWindow.on("closed", () => {
    desktopLyricWindow = null;
    updateHitTestTimer();
    notifyPreferencesChanged();
    updatePowerSaveBlocker();
  });

  desktopLyricWindow.loadURL(desktopLyricUrl).catch((error) => {
    windowLog.error("[desktop-lyric] failed to load companion", error);
  });

  return desktopLyricWindow;
}

function toggleDesktopLyricWindow() {
  if (isWindowAlive(desktopLyricWindow) && desktopLyricWindow.isVisible()) {
    closeDesktopLyricWindow();
    return false;
  }

  showDesktopLyricWindow();
  return true;
}

function updatePreferences(update: DesktopLyricPreferencesUpdate) {
  const nextPreferences = { ...getPreferences(), ...update };
  preferences = nextPreferences;
  savePreferences(nextPreferences);

  if (isWindowAlive(desktopLyricWindow)) {
    applyPreferences(desktopLyricWindow);
  }
  notifyPreferencesChanged();
  updatePowerSaveBlocker();

  return nextPreferences;
}
