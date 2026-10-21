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
const WINDOW_STATE_FILE = "desktop-lyric-window.json";

const DEFAULT_PREFERENCES: DesktopLyricPreferences = {
  alwaysOnTop: true,
  enabled: false,
  locked: false,
  preventSleepOnPlayback: true,
  showSecondaryLyric: true,
  skipTaskbar: true,
};

const DEFAULT_WIDTH = 892;
const DEFAULT_HEIGHT = 160;
const MIN_WIDTH = 400;
const MAX_WIDTH = 10_000;
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 480;
/** 默认位置离工作区底边的距离，避免贴着任务栏。 */
const DEFAULT_BOTTOM_GAP = 24;
const CURSOR_POLL_MS = 100;
const MAX_INTERACTIVE_RECTS = 8;

interface DesktopLyricWindowState {
  height: number;
  width: number;
  x: number | null;
  y: number | null;
}

let mainWindow: BrowserWindow | null = null;
let desktopLyricWindow: BrowserWindow | null = null;
let desktopLyricUrl: null | string = null;
let preferences: DesktopLyricPreferences | null = null;
let ipcRegistered = false;
let powerSaveBlockerId: number | null = null;
let isPlaybackPlaying = false;

/**
 * 窗口尺寸由用户拖边决定宽度、由渲染进程按字号上报高度，不再随歌词内容伸缩，
 * 顶栏里的锁定按钮因此始终停在窗口右上角。setBounds 只写这里的宽高，
 * 不从 getBounds 回读，避免 Windows 高 DPI 下 DIP↔物理像素有损换算导致尺寸漂移。
 */
const cachedSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

// 锁定时整窗穿透，只有渲染进程上报的可交互区域（解锁按钮）会临时恢复可点击。
let interactiveRects: DesktopLyricInteractiveRect[] = [];
let mouseEventsIgnored = false;
// 悬停由主进程按系统光标判定：穿透切换时 DOM 的 mouseenter/leave 会漏发或抖动。
let cursorInside = false;
let cursorPollTimer: ReturnType<typeof setInterval> | null = null;

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

function applyDesktopLyricWindowCommand(command: DesktopLyricCommand) {
  switch (command.type) {
    case "set-desktop-lyric-height":
      if (isWindowAlive(desktopLyricWindow)) applyWindowHeight(desktopLyricWindow, command.height);
      return true;
    case "move-desktop-lyric-window":
      if (isWindowAlive(desktopLyricWindow) && !getPreferences().locked) {
        desktopLyricWindow.setBounds({
          x: Math.round(command.x),
          y: Math.round(command.y),
          width: cachedSize.width,
          height: cachedSize.height,
        });
      }
      return true;
    case "save-desktop-lyric-window":
      saveWindowState();
      return true;
    case "set-desktop-lyric-interactive-region":
      interactiveRects = command.rects;
      syncMousePassthrough();
      return true;
    default:
      return false;
  }
}

function applyWindowHeight(window: BrowserWindow, height: number) {
  const nextHeight = clamp(Math.round(height), MIN_HEIGHT, MAX_HEIGHT);
  if (nextHeight === cachedSize.height) return;
  cachedSize.height = nextHeight;
  window.setMinimumSize(MIN_WIDTH, nextHeight);
  window.setMaximumSize(MAX_WIDTH, nextHeight);
  const bounds = window.getBounds();
  const area = screen.getDisplayMatching(bounds).workArea;
  // 顶栏随窗口顶边固定；只有底部会超出工作区时才整体上移。
  const y = Math.max(area.y, Math.min(bounds.y, area.y + area.height - nextHeight));
  window.setBounds({ x: bounds.x, y, width: cachedSize.width, height: nextHeight });
  saveWindowState();
}

function isPointInInteractiveRegion(x: number, y: number) {
  return interactiveRects.some(
    (rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height,
  );
}

function isCursorOverInteractiveRegion(window: BrowserWindow) {
  const cursor = screen.getCursorScreenPoint();
  const bounds = window.getContentBounds();
  return isPointInInteractiveRegion(cursor.x - bounds.x, cursor.y - bounds.y);
}

function isCursorInsideWindow(window: BrowserWindow) {
  const cursor = screen.getCursorScreenPoint();
  const bounds = window.getBounds();
  return (
    cursor.x >= bounds.x &&
    cursor.x < bounds.x + bounds.width &&
    cursor.y >= bounds.y &&
    cursor.y < bounds.y + bounds.height
  );
}

function syncMousePassthrough(overInteractiveRegion?: boolean) {
  if (!isWindowAlive(desktopLyricWindow)) return;
  const locked = getPreferences().locked;
  const ignore =
    locked && !(overInteractiveRegion ?? isCursorOverInteractiveRegion(desktopLyricWindow));
  if (ignore === mouseEventsIgnored) return;
  // 置顶窗口叠在一起时，恢复可点击前先提到最前，保证解锁点击落在歌词窗口上。
  if (!ignore && locked && process.platform === "win32") desktopLyricWindow.moveTop();
  desktopLyricWindow.setIgnoreMouseEvents(ignore, { forward: true });
  mouseEventsIgnored = ignore;
}

function pollCursor() {
  if (!isWindowAlive(desktopLyricWindow)) {
    stopCursorPolling();
    return;
  }
  // Linux 不支持穿透时转发鼠标事件，只能靠轮询恢复解锁按钮的可点击状态。
  syncMousePassthrough();
  const inside = isCursorInsideWindow(desktopLyricWindow);
  if (inside === cursorInside) return;
  cursorInside = inside;
  desktopLyricWindow.webContents.send("desktop-lyric:cursor-inside", inside);
}

function startCursorPolling() {
  if (cursorPollTimer !== null) return;
  pollCursor();
  cursorPollTimer = setInterval(pollCursor, CURSOR_POLL_MS);
}

function stopCursorPolling() {
  if (cursorPollTimer === null) return;
  clearInterval(cursorPollTimer);
  cursorPollTimer = null;
}

function applyPreferences(window: BrowserWindow) {
  const { alwaysOnTop, locked, skipTaskbar } = getPreferences();
  window.setAlwaysOnTop(alwaysOnTop, "screen-saver");
  window.setSkipTaskbar(skipTaskbar);
  window.setMovable(!locked);
  window.setResizable(!locked);
  // Windows 切换可缩放会改动无边框窗口的系统边框，按权威尺寸写回避免锁定后窗口变形。
  const { x, y } = window.getBounds();
  window.setBounds({ x, y, width: cachedSize.width, height: cachedSize.height });
  syncMousePassthrough();
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function closeDesktopLyricWindow() {
  if (!isWindowAlive(desktopLyricWindow)) return false;
  saveWindowState();
  desktopLyricWindow.destroy();
  desktopLyricWindow = null;
  stopCursorPolling();
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
    case "resize-main-window":
      return (
        isFiniteNonNegativeNumber(value.width) &&
        value.width > 0 &&
        isFiniteNonNegativeNumber(value.height) &&
        value.height > 0
      );
    case "set-desktop-lyric-height":
      return isFiniteNonNegativeNumber(value.height) && value.height > 0;
    case "move-desktop-lyric-window":
      return Number.isFinite(value.x) && Number.isFinite(value.y);
    case "save-desktop-lyric-window":
      return true;
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
    "enabled",
    "locked",
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

function userDataPath(file: string) {
  return join(app.getPath("userData"), file);
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readPreferences(): DesktopLyricPreferences {
  try {
    const raw = fs.readFileSync(userDataPath(PREFERENCES_FILE), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...DEFAULT_PREFERENCES };

    return {
      alwaysOnTop: readBoolean(parsed.alwaysOnTop, DEFAULT_PREFERENCES.alwaysOnTop),
      enabled: readBoolean(parsed.enabled, Boolean(DEFAULT_PREFERENCES.enabled)),
      // 旧版本把锁定叫作 clickThrough。
      locked: readBoolean(
        parsed.locked,
        readBoolean(parsed.clickThrough, DEFAULT_PREFERENCES.locked),
      ),
      preventSleepOnPlayback: readBoolean(
        parsed.preventSleepOnPlayback,
        Boolean(DEFAULT_PREFERENCES.preventSleepOnPlayback),
      ),
      showSecondaryLyric: readBoolean(
        parsed.showSecondaryLyric,
        Boolean(DEFAULT_PREFERENCES.showSecondaryLyric),
      ),
      skipTaskbar: readBoolean(parsed.skipTaskbar, DEFAULT_PREFERENCES.skipTaskbar),
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      windowLog.warn("[desktop-lyric] failed to read preferences", error);
    }
    return { ...DEFAULT_PREFERENCES };
  }
}

function readWindowState(): DesktopLyricWindowState {
  const fallback: DesktopLyricWindowState = {
    height: DEFAULT_HEIGHT,
    width: DEFAULT_WIDTH,
    x: null,
    y: null,
  };
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(userDataPath(WINDOW_STATE_FILE), "utf-8"));
    if (!isRecord(parsed)) return fallback;
    const hasPosition = Number.isFinite(parsed.x) && Number.isFinite(parsed.y);
    return {
      height: isFiniteNonNegativeNumber(parsed.height) ? parsed.height : fallback.height,
      width: isFiniteNonNegativeNumber(parsed.width) ? parsed.width : fallback.width,
      x: hasPosition ? (parsed.x as number) : null,
      y: hasPosition ? (parsed.y as number) : null,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      windowLog.warn("[desktop-lyric] failed to read window state", error);
    }
    return fallback;
  }
}

function resolveInitialBounds(state: DesktopLyricWindowState) {
  const height = clamp(Math.round(state.height), MIN_HEIGHT, MAX_HEIGHT);
  const preferredWidth = clamp(Math.round(state.width), MIN_WIDTH, MAX_WIDTH);

  if (state.x !== null && state.y !== null) {
    // 拔掉副屏或改分辨率后，保存的位置可能已不在任何屏幕内，按最近屏幕的工作区纠正。
    const area = screen.getDisplayMatching({
      x: Math.round(state.x),
      y: Math.round(state.y),
      width: preferredWidth,
      height,
    }).workArea;
    const width = Math.min(preferredWidth, area.width);
    return {
      height,
      width,
      x: clamp(Math.round(state.x), area.x, area.x + area.width - width),
      y: clamp(Math.round(state.y), area.y, area.y + area.height - height),
    };
  }

  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const width = Math.min(preferredWidth, area.width);
  return {
    height,
    width,
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + area.height - height - DEFAULT_BOTTOM_GAP),
  };
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
    if (!isAuthorizedCompanionSender(event) && !isDesktopLyricWindowSender(event)) {
      rejectUnexpectedSender("desktop-lyric:get-preferences");
      return null;
    }
    return getPreferences();
  });

  // 托盘面板也能改偏好：锁定后找不到解锁按钮时，从托盘解锁是最后的退路。
  ipcMain.handle("desktop-lyric:update-preferences", (event, update: unknown) => {
    if (!isAuthorizedCompanionSender(event) && !isDesktopLyricWindowSender(event)) {
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
    if (applyDesktopLyricWindowCommand(command)) return;
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
    fs.writeFileSync(userDataPath(PREFERENCES_FILE), JSON.stringify(nextPreferences), "utf-8");
  } catch (error) {
    windowLog.error("[desktop-lyric] failed to save preferences", error);
  }
}

function saveWindowState() {
  if (!isWindowAlive(desktopLyricWindow)) return;
  const { x, y } = desktopLyricWindow.getBounds();
  const state: DesktopLyricWindowState = { ...cachedSize, x, y };
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(userDataPath(WINDOW_STATE_FILE), JSON.stringify(state), "utf-8");
  } catch (error) {
    windowLog.error("[desktop-lyric] failed to save window state", error);
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

  const bounds = resolveInitialBounds(readWindowState());
  cachedSize.width = bounds.width;
  cachedSize.height = bounds.height;
  const { alwaysOnTop, locked, skipTaskbar } = getPreferences();

  const window = new BrowserWindow({
    ...bounds,
    alwaysOnTop,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    frame: false,
    fullscreenable: false,
    hasShadow: false,
    icon: __iconWindow,
    maxHeight: bounds.height,
    maximizable: false,
    minHeight: bounds.height,
    minimizable: false,
    minWidth: MIN_WIDTH,
    movable: !locked,
    resizable: !locked,
    show: false,
    skipTaskbar,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
    },
  });
  desktopLyricWindow = window;

  mouseEventsIgnored = false;
  interactiveRects = [];
  cursorInside = false;
  applyPreferences(window);

  // 穿透时 Windows 仍会转发 mousemove，借此在光标进入解锁按钮的瞬间恢复可点击，不必等下一次轮询。
  window.webContents.on("before-mouse-event", (_event, mouse) => {
    if (mouse.type !== "mouseMove" && mouse.type !== "mouseEnter" && mouse.type !== "mouseLeave") {
      return;
    }
    syncMousePassthrough(
      mouse.type !== "mouseLeave" && isPointInInteractiveRegion(mouse.x, mouse.y),
    );
  });

  window.webContents.on("did-finish-load", () => {
    // 页面重载后渲染端的悬停状态归零，让下一次轮询重新推送。
    cursorInside = false;
  });

  window.once("ready-to-show", () => {
    if (!isWindowAlive(window)) return;
    window.showInactive();
    window.setAlwaysOnTop(getPreferences().alwaysOnTop, "screen-saver");
    notifyPreferencesChanged();
    updatePowerSaveBlocker();
    startCursorPolling();
  });

  window.webContents.on("did-fail-load", (_event, code, desc, validatedUrl) => {
    windowLog.error("[desktop-lyric] companion failed to load", { code, desc, validatedUrl });
  });

  const syncResizedWidth = () => {
    if (!isWindowAlive(window)) return;
    cachedSize.width = clamp(window.getBounds().width, MIN_WIDTH, MAX_WIDTH);
  };
  window.on("resized", () => {
    syncResizedWidth();
    saveWindowState();
  });
  // Linux 不触发 resized，只能在拖边过程中同步宽度，位置与尺寸在拖拽结束或关闭时落盘。
  if (process.platform === "linux") window.on("resize", syncResizedWidth);

  window.on("closed", () => {
    if (desktopLyricWindow === window) desktopLyricWindow = null;
    stopCursorPolling();
    interactiveRects = [];
    mouseEventsIgnored = false;
    cursorInside = false;
    notifyPreferencesChanged();
    updatePowerSaveBlocker();
  });

  window.loadURL(desktopLyricUrl).catch((error) => {
    windowLog.error("[desktop-lyric] failed to load companion", error);
  });

  return window;
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
