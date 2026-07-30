import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs";
import { join } from "node:path";

import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
  DesktopLyricSnapshotUpdate,
  DesktopLyricTrack,
} from "@scopify/desktop-contract";

import { __iconWindow, __preloadScript, logger } from "../constants.js";

const DESKTOP_LYRIC_ROUTE = "/desktop-lyrics";
const PREFERENCES_FILE = "desktop-lyric.json";

const DEFAULT_PREFERENCES: DesktopLyricPreferences = {
  alwaysOnTop: true,
  clickThrough: false,
  skipTaskbar: true,
};

let mainWindow: BrowserWindow | null = null;
let desktopLyricWindow: BrowserWindow | null = null;
let desktopLyricUrl: null | string = null;
let snapshot: DesktopLyricSnapshot | null = null;
let preferences: DesktopLyricPreferences | null = null;
let ipcRegistered = false;

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

function closeDesktopLyricWindow() {
  if (!isWindowAlive(desktopLyricWindow)) return false;
  desktopLyricWindow.close();
  return true;
}

function getPreferences(): DesktopLyricPreferences {
  preferences ??= readPreferences();
  return preferences;
}

function isDesktopLyricCommand(value: unknown): value is DesktopLyricCommand {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "next":
    case "previous":
    case "toggle-like":
    case "toggle-play":
      return Object.keys(value).length === 1;
    case "resize-main-window":
      return (
        isFiniteNonNegativeNumber(value.width) &&
        value.width > 0 &&
        isFiniteNonNegativeNumber(value.height) &&
        value.height > 0
      );
    case "seek":
      return isFiniteNonNegativeNumber(value.positionMs);
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

  return keys.every(
    (key) =>
      (key === "alwaysOnTop" || key === "skipTaskbar" || key === "clickThrough") &&
      typeof value[key] === "boolean",
  );
}

function isDesktopLyricSnapshotInput(value: unknown): value is DesktopLyricSnapshotInput {
  if (!isRecord(value)) return false;

  return (
    (value.track === null || isDesktopLyricTrack(value.track)) &&
    typeof value.isLiked === "boolean" &&
    typeof value.isPlaying === "boolean" &&
    isFiniteNonNegativeNumber(value.positionMs) &&
    "lyrics" in value
  );
}

function isDesktopLyricSnapshotUpdate(value: unknown): value is DesktopLyricSnapshotUpdate {
  if (!isRecord(value)) return false;

  const keys = Object.keys(value);
  if (keys.length === 0) return false;

  return keys.every((key) => {
    switch (key) {
      case "isLiked":
        return typeof value.isLiked === "boolean";
      case "isPlaying":
        return typeof value.isPlaying === "boolean";
      case "lyrics":
        return true;
      case "positionMs":
        return isFiniteNonNegativeNumber(value.positionMs);
      case "track":
        return value.track === null || isDesktopLyricTrack(value.track);
      default:
        return false;
    }
  });
}

function isDesktopLyricTrack(value: unknown): value is DesktopLyricTrack {
  if (!isRecord(value)) return false;

  const hasValidId = typeof value.id === "string" || typeof value.id === "number";
  const hasValidArtists =
    Array.isArray(value.artistNames) &&
    value.artistNames.every((artist) => typeof artist === "string");

  return (
    hasValidId &&
    typeof value.title === "string" &&
    hasValidArtists &&
    isFiniteNonNegativeNumber(value.durationMs) &&
    (value.albumTitle === undefined || typeof value.albumTitle === "string") &&
    (value.artworkUrl === undefined || typeof value.artworkUrl === "string")
  );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWindowAlive(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed();
}

function preferencesPath() {
  return join(app.getPath("userData"), PREFERENCES_FILE);
}

function publishSnapshot(nextSnapshot: DesktopLyricSnapshotInput) {
  snapshot = {
    ...nextSnapshot,
    updatedAt: Date.now(),
  };

  if (isWindowAlive(desktopLyricWindow)) {
    desktopLyricWindow.webContents.send("desktop-lyric:snapshot", snapshot);
  }

  return snapshot;
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
      skipTaskbar:
        typeof parsed.skipTaskbar === "boolean"
          ? parsed.skipTaskbar
          : DEFAULT_PREFERENCES.skipTaskbar,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      logger.warn("[desktop-lyric] failed to read preferences", error);
    }
    return { ...DEFAULT_PREFERENCES };
  }
}

function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle("desktop-lyric:open", (event) => {
    if (!isMainWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:open");
      return false;
    }
    showDesktopLyricWindow();
    return true;
  });

  ipcMain.handle("desktop-lyric:toggle", (event) => {
    if (!isMainWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:toggle");
      return false;
    }
    return toggleDesktopLyricWindow();
  });

  ipcMain.handle("desktop-lyric:close", (event) => {
    if (!isMainWindowSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:close");
      return false;
    }
    return closeDesktopLyricWindow();
  });

  ipcMain.handle("desktop-lyric:get-snapshot", (event) => {
    if (!isMainWindowSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:get-snapshot");
      return null;
    }
    return snapshot;
  });

  ipcMain.handle("desktop-lyric:publish-snapshot", (event, nextSnapshot: unknown) => {
    if (!isMainWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:publish-snapshot");
      return null;
    }
    if (!isDesktopLyricSnapshotInput(nextSnapshot)) {
      logger.warn("[desktop-lyric] rejected invalid snapshot");
      return null;
    }
    return publishSnapshot(nextSnapshot);
  });

  ipcMain.handle("desktop-lyric:update-snapshot", (event, update: unknown) => {
    if (!isMainWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:update-snapshot");
      return null;
    }
    if (!isDesktopLyricSnapshotUpdate(update)) {
      logger.warn("[desktop-lyric] rejected invalid snapshot update");
      return null;
    }
    return updateSnapshot(update);
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
      logger.warn("[desktop-lyric] rejected invalid preferences update");
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
      logger.warn("[desktop-lyric] rejected invalid command");
      return;
    }
    if (applyMainWindowCommand(command)) return;
    if (isWindowAlive(mainWindow)) {
      mainWindow.webContents.send("desktop-lyric:command", command);
    }
  });
}

function rejectUnexpectedSender(channel: string) {
  logger.warn(`[desktop-lyric] rejected IPC from an unexpected renderer: ${channel}`);
}

function savePreferences(nextPreferences: DesktopLyricPreferences) {
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(preferencesPath(), JSON.stringify(nextPreferences), "utf-8");
  } catch (error) {
    logger.error("[desktop-lyric] failed to save preferences", error);
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
    if (snapshot) {
      desktopLyricWindow?.webContents.send("desktop-lyric:snapshot", snapshot);
    }
    desktopLyricWindow?.webContents.send("desktop-lyric:preferences", getPreferences());
  });

  desktopLyricWindow.webContents.on("did-fail-load", (_event, code, desc, validatedUrl) => {
    logger.error("[desktop-lyric] companion failed to load", { code, desc, validatedUrl });
  });

  desktopLyricWindow.on("closed", () => {
    desktopLyricWindow = null;
  });

  desktopLyricWindow.loadURL(desktopLyricUrl).catch((error) => {
    logger.error("[desktop-lyric] failed to load companion", error);
  });

  return desktopLyricWindow;
}

function toggleDesktopLyricWindow() {
  if (isWindowAlive(desktopLyricWindow) && desktopLyricWindow.isVisible()) {
    desktopLyricWindow.hide();
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

  return nextPreferences;
}

function updateSnapshot(update: DesktopLyricSnapshotUpdate) {
  if (!snapshot) return null;
  return publishSnapshot({ ...snapshot, ...update });
}
