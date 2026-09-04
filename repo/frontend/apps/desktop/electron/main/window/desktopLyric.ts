import { app, BrowserWindow, ipcMain, powerSaveBlocker, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs";
import { join } from "node:path";

import type {
  DesktopLyricCommand,
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

function applyPreferences(window: BrowserWindow) {
  const currentPreferences = getPreferences();
  window.setAlwaysOnTop(currentPreferences.alwaysOnTop, "floating");
  window.setSkipTaskbar(currentPreferences.skipTaskbar);
  window.setIgnoreMouseEvents(currentPreferences.clickThrough, {
    forward: currentPreferences.clickThrough,
  });
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

function isDesktopLyricCommand(value: unknown): value is DesktopLyricCommand {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "resize-main-window":
      return (
        isFiniteNonNegativeNumber(value.width) &&
        value.width > 0 &&
        isFiniteNonNegativeNumber(value.height) &&
        value.height > 0
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
    if (!isAuthorizedCompanionSender(event)) {
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
    desktopLyricWindow.show();
    desktopLyricWindow.focus();
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
    height: 230,
    icon: __iconWindow,
    maxHeight: 230,
    maxWidth: 450,
    minHeight: 230,
    minWidth: 450,
    resizable: false,
    show: false,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
    },
    width: 450,
  });

  applyPreferences(desktopLyricWindow);

  desktopLyricWindow.once("ready-to-show", () => {
    desktopLyricWindow?.show();
    desktopLyricWindow?.webContents.send("desktop-lyric:preferences", getPreferences());
    updatePowerSaveBlocker();
  });

  desktopLyricWindow.webContents.on("did-fail-load", (_event, code, desc, validatedUrl) => {
    windowLog.error("[desktop-lyric] companion failed to load", { code, desc, validatedUrl });
  });

  desktopLyricWindow.on("closed", () => {
    desktopLyricWindow = null;
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
    desktopLyricWindow.webContents.send("desktop-lyric:preferences", nextPreferences);
  }
  updatePowerSaveBlocker();

  return nextPreferences;
}
