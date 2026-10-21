import { app, BrowserWindow, ipcMain, screen, type IpcMainInvokeEvent } from "electron";

import type {
  TaskbarLyricColorMode,
  TaskbarLyricCommand,
  TaskbarLyricLayout,
  TaskbarLyricPosition,
  TaskbarLyricPreferences,
  TaskbarLyricPreferencesUpdate,
} from "@scopify/desktop-contract";
import type {
  TaskbarLyricNativeModule,
  TaskbarNativeLayout,
  TaskbarNativeRect,
  TaskbarNativeService,
  TaskbarNativeWatcher,
} from "@/types/taskbarLyricNative";

import { __preloadScript } from "@main/constants";
import { createNativeModuleLoader } from "@main/services/nativeModuleLoader";
import { windowLog } from "@main/utils/logger";
import { isRecord, readUserDataJson, writeUserDataJson } from "@main/utils/userDataJson";
import { getTrayWindow } from "@main/window/tray";

// 嵌入逻辑移植自 SPlayer-Next（AGPL-3.0）的任务栏歌词：原生模块把窗口 SetParent 到
// Shell_TrayWnd，并监听任务栏布局变化回调可用空间，这里负责换算坐标与裁切命中区域。

const TASKBAR_LYRIC_ROUTE = "/taskbar-lyric";
const PREFERENCES_FILE = "taskbar-lyric.json";
const REG_EXPLORER_ADVANCED = "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";
const REG_PERSONALIZE = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

const DEFAULT_PREFERENCES: TaskbarLyricPreferences = {
  autoAdjustOccupiedSpace: false,
  autoMaxWidth: true,
  colorMode: "taskbar",
  doubleLine: true,
  fontSize: 14,
  leftMargin: 0,
  maxWidth: 400,
  position: "auto",
  rightMargin: 0,
  showBackground: false,
  showCover: true,
  showTranslation: true,
};

const NUMBER_RANGES = {
  fontSize: [10, 32],
  leftMargin: [0, 500],
  maxWidth: [120, 2_000],
  rightMargin: [0, 500],
} as const;
const POSITIONS: TaskbarLyricPosition[] = ["auto", "left", "right"];
const COLOR_MODES: TaskbarLyricColorMode[] = ["dark", "light", "taskbar", "taskbarInverse"];

/**
 * 初始尺寸故意开到比任何任务栏都大：透明窗口 SetParent 到任务栏后，Chromium 的合成层
 * 不会随 setBounds 扩大，超出初始尺寸的区域 alpha 为 0、点不到。之后只缩小，不放大。
 */
const INITIAL_WIDTH = 3_000;
const INITIAL_HEIGHT = 200;
/** 可用空间小于该宽度时歌词会被挤成几个字，直接隐藏。 */
const MIN_LYRIC_WIDTH = 120;

interface TaskbarLyricRegion {
  anchor: "left" | "right";
  height: number;
  width: number;
}

let mainWindow: BrowserWindow | null = null;
let taskbarWindow: BrowserWindow | null = null;
let taskbarUrl: null | string = null;
let preferences: TaskbarLyricPreferences | null = null;
let nativeModule: TaskbarLyricNativeModule | null = null;
let nativeUnavailable = false;
let service: TaskbarNativeService | null = null;
let layoutWatchers: TaskbarNativeWatcher[] = [];
let explorerWatcher: TaskbarNativeWatcher | null = null;
let region: TaskbarLyricRegion | null = null;
let layout: TaskbarLyricLayout | null = null;
let contentWidth: number | null = null;
let firstLayoutApplied = false;
let ipcRegistered = false;

const nativeLoader = createNativeModuleLoader({
  context: () => ({
    appPath: app.getAppPath(),
    arch: process.arch,
    isPackaged: app.isPackaged,
    platform: process.platform,
    resourcesPath: process.resourcesPath,
  }),
});

export interface TaskbarLyricCompanionOptions {
  rendererBaseUrl: string;
}

export function initializeTaskbarLyricCompanion(
  nextMainWindow: BrowserWindow,
  options: TaskbarLyricCompanionOptions,
) {
  mainWindow = nextMainWindow;
  taskbarUrl = new URL(TASKBAR_LYRIC_ROUTE, options.rendererBaseUrl).toString();
  registerIpcHandlers();
}

export function getTaskbarLyricWindow() {
  return isWindowAlive(taskbarWindow) ? taskbarWindow : null;
}

function isWindowAlive(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed();
}

function loadNativeModule() {
  if (nativeModule || nativeUnavailable) return nativeModule;
  const loaded = nativeLoader.loadTaskbarLyric();
  const candidate = loaded.available ? (loaded.module as Partial<TaskbarLyricNativeModule>) : null;
  const valid =
    candidate &&
    (
      [
        "RegistryWatcher",
        "TaskbarCreatedWatcher",
        "TaskbarService",
        "TrayWatcher",
        "UiaWatcher",
      ] as const
    ).every((name) => typeof candidate[name] === "function");
  if (!valid) {
    nativeUnavailable = true;
    windowLog.warn(
      "[taskbar-lyric] native module unavailable",
      loaded.available ? "invalid exports" : loaded.diagnostic,
    );
    return null;
  }
  nativeModule = candidate as TaskbarLyricNativeModule;
  return nativeModule;
}

function isSupported() {
  return process.platform === "win32" && loadNativeModule() !== null;
}

function getPreferences(): TaskbarLyricPreferences {
  preferences ??= readPreferences();
  return { ...preferences, enabled: isWindowAlive(taskbarWindow), supported: isSupported() };
}

function readPreferences(): TaskbarLyricPreferences {
  const parsed = readUserDataJson(PREFERENCES_FILE, windowLog);
  if (!isRecord(parsed)) return { ...DEFAULT_PREFERENCES };
  const next = { ...DEFAULT_PREFERENCES };
  for (const [key, value] of Object.entries(parsed)) {
    if (key !== "enabled" && key !== "supported" && isValidPreference(key, value)) {
      Object.assign(next, { [key]: value });
    }
  }
  return next;
}

function isValidPreference(key: string, value: unknown) {
  switch (key) {
    case "autoAdjustOccupiedSpace":
    case "autoMaxWidth":
    case "doubleLine":
    case "enabled":
    case "showBackground":
    case "showCover":
    case "showTranslation":
      return typeof value === "boolean";
    case "fontSize":
    case "leftMargin":
    case "maxWidth":
    case "rightMargin": {
      const [min, max] = NUMBER_RANGES[key];
      return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
    }
    case "position":
      return POSITIONS.includes(value as TaskbarLyricPosition);
    case "colorMode":
      return COLOR_MODES.includes(value as TaskbarLyricColorMode);
    default:
      return false;
  }
}

function lyricWidthHint() {
  // Win10 按这个宽度从任务列表里让出空间；Win11 直接使用图标两侧的空白。
  return getPreferences().maxWidth;
}

/** 按设置与任务栏是否居中挑选左右哪块空间，以及歌词贴向哪一侧。 */
function pickSpace(native: TaskbarNativeLayout) {
  const { position } = getPreferences();
  const { left, right } = native.space;
  const pick = (rect: TaskbarNativeRect, anchor: "left" | "right") => ({ anchor, rect });
  if (position === "left" && left.width > 0) return pick(left, "left");
  if (position === "right" && right.width > 0) return pick(right, "right");
  if (native.extra.isCentered)
    return left.width >= right.width ? pick(left, "left") : pick(right, "right");
  if (right.width > 0) return pick(right, "right");
  if (left.width > 0) return pick(left, "left");
  return null;
}

/**
 * 窗口本体保持可用区域全宽，只在布局真变时 setBounds（维持“只缩小”的嵌入约束）；
 * 内容收缩靠 setShape 裁切命中区域，空白处的点击直接落回任务栏，切行时窗口也不必移动。
 */
function applyContentShape() {
  if (!isWindowAlive(taskbarWindow) || !region) return;
  const { autoAdjustOccupiedSpace, autoMaxWidth } = getPreferences();
  const preferred =
    autoMaxWidth && autoAdjustOccupiedSpace ? (contentWidth ?? region.width) : region.width;
  const width = Math.min(region.width, Math.max(MIN_LYRIC_WIDTH, Math.round(preferred)));
  if (width >= region.width) {
    taskbarWindow.setShape([]);
    return;
  }
  const x = region.anchor === "right" ? region.width - width : 0;
  taskbarWindow.setShape([{ x, y: 0, width, height: region.height }]);
}

function hide(window: BrowserWindow) {
  if (window.isVisible()) window.hide();
}

/** 原生回调：物理像素换算为 DIP，空间不足时隐藏，否则定位并显示。 */
function applyLayout(native: TaskbarNativeLayout) {
  if (!isWindowAlive(taskbarWindow)) return;
  const picked = pickSpace(native);
  if (!picked || picked.rect.width <= 0 || picked.rect.height <= 0) {
    hide(taskbarWindow);
    return;
  }

  // 原生侧只处理主屏的 Shell_TrayWnd，按主屏缩放换算即可。
  const scale = screen.getPrimaryDisplay().scaleFactor;
  const { autoMaxWidth, leftMargin, maxWidth, rightMargin } = getPreferences();
  const availableX = Math.round(picked.rect.x / scale) + leftMargin;
  const availableWidth = Math.round(picked.rect.width / scale) - leftMargin - rightMargin;
  const height = Math.round(picked.rect.height / scale);
  if (availableWidth < MIN_LYRIC_WIDTH) {
    hide(taskbarWindow);
    return;
  }

  const width = autoMaxWidth ? availableWidth : Math.min(maxWidth, availableWidth);
  const x = picked.anchor === "right" ? availableX + availableWidth - width : availableX;
  region = { anchor: picked.anchor, height, width };
  taskbarWindow.setBounds({ x, y: Math.round(picked.rect.y / scale), width, height });
  applyContentShape();
  if (!firstLayoutApplied || !taskbarWindow.isVisible()) {
    firstLayoutApplied = true;
    taskbarWindow.showInactive();
  }

  layout = {
    anchor: picked.anchor,
    isCentered: native.extra.isCentered,
    isLight: native.extra.isLight,
    maxWidth: width,
    systemType: native.extra.systemType === "win10" ? "win10" : "win11",
  };
  taskbarWindow.webContents.send("taskbar-lyric:layout", layout);
}

function requestLayout() {
  service?.update(lyricWidthHint());
}

function startWatchers(native: TaskbarLyricNativeModule) {
  const tryStart = (name: string, create: () => TaskbarNativeWatcher) => {
    try {
      return create();
    } catch (error) {
      windowLog.warn(`[taskbar-lyric] ${name} failed to start`, error);
      return null;
    }
  };
  layoutWatchers = [
    tryStart(
      "RegistryWatcher(Advanced)",
      () => new native.RegistryWatcher(REG_EXPLORER_ADVANCED, requestLayout),
    ),
    tryStart(
      "RegistryWatcher(Personalize)",
      () => new native.RegistryWatcher(REG_PERSONALIZE, requestLayout),
    ),
    tryStart("UiaWatcher", () => new native.UiaWatcher(requestLayout)),
    tryStart("TrayWatcher", () => new native.TrayWatcher(requestLayout)),
  ].filter((watcher): watcher is TaskbarNativeWatcher => watcher !== null);
}

function stopLayoutWatchers() {
  for (const watcher of layoutWatchers) watcher.stop();
  layoutWatchers = [];
}

/** explorer.exe 重启后旧 watcher 绑在旧进程上，整体重建，并让原生服务用记住的窗口重新嵌入。 */
function onExplorerRestart() {
  windowLog.info("[taskbar-lyric] explorer restarted, re-embedding");
  stopLayoutWatchers();
  service?.reinit();
  if (nativeModule) startWatchers(nativeModule);
}

function cleanupNative() {
  stopLayoutWatchers();
  explorerWatcher?.stop();
  explorerWatcher = null;
  service?.stop();
  service = null;
}

function showTaskbarLyricWindow() {
  if (isWindowAlive(taskbarWindow)) return taskbarWindow;
  const native = process.platform === "win32" ? loadNativeModule() : null;
  if (!native || !taskbarUrl) return null;

  service = new native.TaskbarService(applyLayout);
  firstLayoutApplied = false;
  region = null;
  layout = null;
  contentWidth = null;

  const window = new BrowserWindow({
    backgroundColor: "#00000000",
    frame: false,
    fullscreenable: false,
    hasShadow: false,
    height: INITIAL_HEIGHT,
    maximizable: false,
    minHeight: 0,
    minimizable: false,
    minWidth: 0,
    movable: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    transparent: true,
    type: "toolbar",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
    },
    width: INITIAL_WIDTH,
  });
  taskbarWindow = window;

  window.once("ready-to-show", () => {
    if (!isWindowAlive(window) || !service) return;
    // HWND 可能是 64 位值，先按 BigInt 读，超出安全整数时放弃嵌入而不是静默截断。
    const hwnd = window.getNativeWindowHandle().readBigUInt64LE(0);
    if (hwnd > BigInt(Number.MAX_SAFE_INTEGER)) {
      windowLog.error(`[taskbar-lyric] hwnd ${hwnd.toString()} exceeds the safe integer range`);
      return;
    }
    service.embedWindowByPtr(Number(hwnd));
    requestLayout();
    startWatchers(native);
    try {
      explorerWatcher = new native.TaskbarCreatedWatcher(onExplorerRestart);
    } catch (error) {
      windowLog.warn("[taskbar-lyric] TaskbarCreatedWatcher failed to start", error);
    }
  });

  window.webContents.on("did-fail-load", (_event, code, desc, validatedUrl) => {
    windowLog.error("[taskbar-lyric] failed to load", { code, desc, validatedUrl });
  });

  window.on("closed", () => {
    if (taskbarWindow === window) taskbarWindow = null;
    cleanupNative();
    region = null;
    layout = null;
    notifyPreferencesChanged();
  });

  window.loadURL(taskbarUrl).catch((error) => {
    windowLog.error("[taskbar-lyric] failed to load", error);
  });
  notifyPreferencesChanged();
  return window;
}

function closeTaskbarLyricWindow() {
  if (!isWindowAlive(taskbarWindow)) return false;
  taskbarWindow.close();
  return true;
}

function toggleTaskbarLyricWindow() {
  if (isWindowAlive(taskbarWindow)) {
    closeTaskbarLyricWindow();
    return false;
  }
  return showTaskbarLyricWindow() !== null;
}

function notifyPreferencesChanged() {
  const current = getPreferences();
  for (const window of [mainWindow, taskbarWindow, getTrayWindow()]) {
    if (isWindowAlive(window)) window.webContents.send("taskbar-lyric:preferences", current);
  }
}

function updatePreferences(update: TaskbarLyricPreferencesUpdate) {
  const next: TaskbarLyricPreferences = { ...getPreferences(), ...update };
  const enabled = next.enabled;
  // enabled / supported 由运行状态决定，不落盘。
  delete next.enabled;
  delete next.supported;
  preferences = next;
  writeUserDataJson(PREFERENCES_FILE, next, windowLog);

  if (enabled !== isWindowAlive(taskbarWindow)) {
    if (enabled) showTaskbarLyricWindow();
    else closeTaskbarLyricWindow();
  }
  requestLayout();
  applyContentShape();
  notifyPreferencesChanged();
  return getPreferences();
}

function isTaskbarLyricPreferencesUpdate(value: unknown): value is TaskbarLyricPreferencesUpdate {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([key, field]) => isValidPreference(key, field));
}

function isTaskbarLyricCommand(value: unknown): value is TaskbarLyricCommand {
  return (
    isRecord(value) &&
    value.type === "set-taskbar-lyric-content-width" &&
    typeof value.width === "number" &&
    Number.isFinite(value.width) &&
    value.width > 0
  );
}

function isSender(window: BrowserWindow | null, event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  return isWindowAlive(window) && event.sender.id === window.webContents.id;
}

function isControllerSender(event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  return isSender(mainWindow, event) || isSender(getTrayWindow(), event);
}

function rejectUnexpectedSender(channel: string) {
  windowLog.warn(`[taskbar-lyric] rejected IPC from an unexpected renderer: ${channel}`);
}

function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  const handleControl = <T>(channel: string, fallback: T, run: () => T) => {
    ipcMain.handle(channel, (event) => {
      if (!isControllerSender(event)) {
        rejectUnexpectedSender(channel);
        return fallback;
      }
      return run();
    });
  };
  handleControl("taskbar-lyric:open", false, () => showTaskbarLyricWindow() !== null);
  handleControl("taskbar-lyric:close", false, closeTaskbarLyricWindow);
  handleControl("taskbar-lyric:toggle", false, toggleTaskbarLyricWindow);

  ipcMain.handle("taskbar-lyric:get-preferences", (event) => {
    if (!isControllerSender(event) && !isSender(taskbarWindow, event)) {
      rejectUnexpectedSender("taskbar-lyric:get-preferences");
      return null;
    }
    return getPreferences();
  });

  ipcMain.handle("taskbar-lyric:get-layout", (event) => {
    if (!isSender(taskbarWindow, event)) {
      rejectUnexpectedSender("taskbar-lyric:get-layout");
      return null;
    }
    return layout;
  });

  ipcMain.handle("taskbar-lyric:update-preferences", (event, update: unknown) => {
    if (!isControllerSender(event)) {
      rejectUnexpectedSender("taskbar-lyric:update-preferences");
      return null;
    }
    if (!isTaskbarLyricPreferencesUpdate(update)) {
      windowLog.warn("[taskbar-lyric] rejected invalid preferences update");
      return null;
    }
    return updatePreferences(update);
  });

  ipcMain.on("taskbar-lyric:command", (event, command: unknown) => {
    if (!isSender(taskbarWindow, event)) {
      rejectUnexpectedSender("taskbar-lyric:command");
      return;
    }
    if (!isTaskbarLyricCommand(command)) {
      windowLog.warn("[taskbar-lyric] rejected invalid command");
      return;
    }
    contentWidth = command.width;
    applyContentShape();
  });
}
