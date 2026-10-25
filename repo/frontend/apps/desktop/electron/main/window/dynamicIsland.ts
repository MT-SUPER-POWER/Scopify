import { BrowserWindow, ipcMain, screen, type IpcMainInvokeEvent } from "electron";

import type {
  DynamicIslandCommand,
  DynamicIslandMode,
  DynamicIslandPreferences,
  DynamicIslandPreferencesUpdate,
} from "@scopify/desktop-contract";

import { __iconWindow, __preloadScript } from "@main/constants";
import { windowLog } from "@main/utils/logger";
import { isRecord, readUserDataJson, writeUserDataJson } from "@main/utils/userDataJson";
import { getTrayWindow } from "@main/window/tray";

// 交互模型移植自 SPlayer-Next（AGPL-3.0）的灵动岛窗口。

const DYNAMIC_ISLAND_ROUTE = "/dynamic-island";
const PREFERENCES_FILE = "dynamic-island.json";
const WINDOW_STATE_FILE = "dynamic-island-window.json";

const DEFAULT_PREFERENCES: DynamicIslandPreferences = {
  alwaysOnTop: true,
  nonOcclusive: false,
  scale: 1,
  showTranslation: false,
  snapCentered: true,
  transition: "smooth",
};

const MIN_SCALE = 0.8;
const MAX_SCALE = 2;
/** 窗口宽度上限：胶囊在透明窗口内伸缩，窗口本身只按显示器定一次宽度。 */
const MAX_WIDTH = 620;
const MAX_WIDTH_RATIO = 0.55;
const MIN_HEIGHT = 14;
const MAX_HEIGHT = 200;
const INITIAL_HEIGHT = 40;
/** 拖拽松手时离顶边小于该距离则吸附。 */
const SNAP_THRESHOLD = 8;
const CURSOR_POLL_MS = 120;

interface DynamicIslandWindowState {
  mode: DynamicIslandMode;
  /** 吸附态记录胶囊中心点 x（null 表示居中）；悬浮态记录窗口左上角。 */
  x: number | null;
  y: number | null;
}

let mainWindow: BrowserWindow | null = null;
let islandWindow: BrowserWindow | null = null;
let islandUrl: null | string = null;
let preferences: DynamicIslandPreferences | null = null;
let windowState: DynamicIslandWindowState | null = null;
let ipcRegistered = false;

/** 权威尺寸缓存，setBounds 只写这里的宽高，避免高 DPI 下尺寸漂移。 */
const cachedSize = { width: MAX_WIDTH, height: INITIAL_HEIGHT };
/** 胶囊当前宽度：透明两侧不参与命中和悬停判定。 */
let shapeWidth: number | null = null;
let broadcastMode: DynamicIslandMode | null = null;
let cursorInside = false;
let cursorPollTimer: ReturnType<typeof setInterval> | null = null;

export interface DynamicIslandCompanionOptions {
  rendererBaseUrl: string;
}

export function initializeDynamicIslandCompanion(
  nextMainWindow: BrowserWindow,
  options: DynamicIslandCompanionOptions,
) {
  mainWindow = nextMainWindow;
  islandUrl = new URL(DYNAMIC_ISLAND_ROUTE, options.rendererBaseUrl).toString();
  registerIpcHandlers();
}

export function getDynamicIslandWindow() {
  return isWindowAlive(islandWindow) ? islandWindow : null;
}

function isWindowAlive(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPreferences(): DynamicIslandPreferences {
  preferences ??= readPreferences();
  return { ...preferences, enabled: isWindowAlive(islandWindow) };
}

function readPreferences(): DynamicIslandPreferences {
  const parsed = readUserDataJson(PREFERENCES_FILE, windowLog);
  if (!isRecord(parsed)) return { ...DEFAULT_PREFERENCES };
  const bool = (key: keyof DynamicIslandPreferences) =>
    typeof parsed[key] === "boolean" ? parsed[key] : DEFAULT_PREFERENCES[key];
  return {
    alwaysOnTop: bool("alwaysOnTop") as boolean,
    nonOcclusive: bool("nonOcclusive") as boolean,
    scale: isValidScale(parsed.scale) ? parsed.scale : DEFAULT_PREFERENCES.scale,
    showTranslation: bool("showTranslation") as boolean,
    snapCentered: bool("snapCentered") as boolean,
    transition:
      parsed.transition === "smooth" || parsed.transition === "bounce"
        ? parsed.transition
        : DEFAULT_PREFERENCES.transition,
  };
}

function isValidScale(value: unknown): value is number {
  return typeof value === "number" && value >= MIN_SCALE && value <= MAX_SCALE;
}

function getWindowState(): DynamicIslandWindowState {
  if (windowState) return windowState;
  const parsed = readUserDataJson(WINDOW_STATE_FILE, windowLog);
  windowState =
    isRecord(parsed) && (parsed.mode === "floating" || parsed.mode === "snapped")
      ? {
          mode: parsed.mode,
          x: Number.isFinite(parsed.x) ? (parsed.x as number) : null,
          y: Number.isFinite(parsed.y) ? (parsed.y as number) : null,
        }
      : { mode: "snapped", x: null, y: null };
  return windowState;
}

function setWindowState(next: DynamicIslandWindowState) {
  windowState = next;
  writeUserDataJson(WINDOW_STATE_FILE, next, windowLog);
}

function getWindowDisplay() {
  if (isWindowAlive(islandWindow)) {
    const bounds = islandWindow.getBounds();
    return screen.getDisplayNearestPoint({
      x: bounds.x + Math.round(bounds.width / 2),
      y: bounds.y + Math.round(bounds.height / 2),
    });
  }
  const state = getWindowState();
  if (state.x !== null && state.y !== null) {
    return screen.getDisplayNearestPoint({ x: Math.round(state.x), y: Math.round(state.y) });
  }
  return screen.getPrimaryDisplay();
}

function computeWindowWidth(display: Electron.Display) {
  return Math.min(MAX_WIDTH, Math.floor(display.workArea.width * MAX_WIDTH_RATIO));
}

/** 吸附位置：贴工作区顶边；居中或按记录的中心点水平定位。 */
function computeSnappedPosition(display: Electron.Display) {
  const area = display.workArea;
  const state = getWindowState();
  const centerX =
    getPreferences().snapCentered || state.x === null
      ? area.x + Math.round(area.width / 2)
      : state.x;
  return {
    x: clamp(
      Math.round(centerX - cachedSize.width / 2),
      area.x,
      area.x + area.width - cachedSize.width,
    ),
    y: area.y,
  };
}

function setIslandBounds(position: { x: number; y: number }) {
  if (!isWindowAlive(islandWindow)) return;
  islandWindow.setBounds({ ...position, width: cachedSize.width, height: cachedSize.height });
  applyShape();
}

function notifyMode(mode: DynamicIslandMode) {
  if (mode === broadcastMode || !isWindowAlive(islandWindow)) return;
  broadcastMode = mode;
  islandWindow.webContents.send("dynamic-island:mode", mode);
}

function applyShape() {
  // macOS 透明像素天然不参与命中，setShape 也只支持 Windows/Linux。
  if (!isWindowAlive(islandWindow) || process.platform === "darwin") return;
  if (shapeWidth === null || shapeWidth >= cachedSize.width) {
    islandWindow.setShape([]);
    return;
  }
  const width = Math.max(1, Math.round(shapeWidth));
  islandWindow.setShape([
    { x: Math.round((cachedSize.width - width) / 2), y: 0, width, height: cachedSize.height },
  ]);
}

function isCursorInsideShape(window: BrowserWindow) {
  const cursor = screen.getCursorScreenPoint();
  const bounds = window.getBounds();
  const width = Math.min(bounds.width, shapeWidth ?? bounds.width);
  const left = bounds.x + Math.round((bounds.width - width) / 2);
  return (
    cursor.x >= left &&
    cursor.x < left + width &&
    cursor.y >= bounds.y &&
    cursor.y < bounds.y + bounds.height
  );
}

function pollCursor() {
  if (!isWindowAlive(islandWindow)) {
    stopCursorPolling();
    return;
  }
  const inside = isCursorInsideShape(islandWindow);
  if (inside === cursorInside) return;
  cursorInside = inside;
  islandWindow.webContents.send("dynamic-island:cursor-inside", inside);
}

function stopCursorPolling() {
  if (cursorPollTimer === null) return;
  clearInterval(cursorPollTimer);
  cursorPollTimer = null;
}

function applyPreferences(window: BrowserWindow) {
  const { alwaysOnTop, nonOcclusive } = getPreferences();
  window.setAlwaysOnTop(alwaysOnTop, "screen-saver");
  // 非遮挡模式整窗穿透，渲染端在悬停时把胶囊淡出，让出下方内容。
  window.setIgnoreMouseEvents(nonOcclusive, { forward: true });
}

function applyHeight(height: number) {
  if (!isWindowAlive(islandWindow)) return;
  const nextHeight = clamp(Math.round(height), MIN_HEIGHT, MAX_HEIGHT);
  if (nextHeight === cachedSize.height) return;
  cachedSize.height = nextHeight;
  if (getWindowState().mode === "snapped") {
    setIslandBounds(computeSnappedPosition(getWindowDisplay()));
  } else {
    const { x, y } = islandWindow.getBounds();
    setIslandBounds({ x, y });
  }
}

/** 拖拽中自由移动，只限制纵向不越出工作区；跨过吸附线时实时切换圆角形态。 */
function moveIsland(x: number, y: number) {
  if (!isWindowAlive(islandWindow)) return;
  const display = screen.getDisplayNearestPoint({
    x: Math.round(x + cachedSize.width / 2),
    y: Math.round(y + cachedSize.height / 2),
  });
  const area = display.workArea;
  const nextY = clamp(Math.round(y), area.y, area.y + area.height - cachedSize.height);
  islandWindow.setBounds({
    x: Math.round(x),
    y: nextY,
    width: cachedSize.width,
    height: cachedSize.height,
  });
  notifyMode(nextY <= area.y ? "snapped" : "floating");
}

/** 松手时判定吸附并持久化；跨屏后按新显示器重算窗口宽度。 */
function settleIsland() {
  if (!isWindowAlive(islandWindow)) return;
  const display = getWindowDisplay();
  const bounds = islandWindow.getBounds();
  const centerX = bounds.x + Math.round(bounds.width / 2);
  cachedSize.width = computeWindowWidth(display);
  const area = display.workArea;

  if (bounds.y - area.y <= SNAP_THRESHOLD) {
    setWindowState({ mode: "snapped", x: getPreferences().snapCentered ? null : centerX, y: null });
    setIslandBounds(computeSnappedPosition(display));
    notifyMode("snapped");
    return;
  }

  const x = Math.round(centerX - cachedSize.width / 2);
  setWindowState({ mode: "floating", x, y: bounds.y });
  setIslandBounds({ x, y: bounds.y });
  notifyMode("floating");
}

function resolveInitialPosition(display: Electron.Display) {
  const state = getWindowState();
  if (state.mode === "floating" && state.x !== null && state.y !== null) {
    // 保存的悬浮位置可能已不在任何屏幕内（拔副屏、改分辨率），按最近屏幕的工作区纠正。
    const area = display.workArea;
    return {
      x: clamp(Math.round(state.x), area.x, area.x + area.width - cachedSize.width),
      y: clamp(Math.round(state.y), area.y, area.y + area.height - cachedSize.height),
    };
  }
  return computeSnappedPosition(display);
}

function showDynamicIslandWindow() {
  if (isWindowAlive(islandWindow)) {
    islandWindow.showInactive();
    return islandWindow;
  }
  if (!islandUrl) throw new Error("Dynamic island was not initialized before opening.");

  const display = getWindowDisplay();
  cachedSize.width = computeWindowWidth(display);
  cachedSize.height = Math.round(INITIAL_HEIGHT * getPreferences().scale);
  shapeWidth = null;
  broadcastMode = null;
  cursorInside = false;
  const position = resolveInitialPosition(display);

  const window = new BrowserWindow({
    ...position,
    alwaysOnTop: getPreferences().alwaysOnTop,
    backgroundColor: "#00000000",
    frame: false,
    fullscreenable: false,
    hasShadow: false,
    height: cachedSize.height,
    icon: __iconWindow,
    maximizable: false,
    minHeight: MIN_HEIGHT,
    minimizable: false,
    minWidth: 1,
    resizable: false,
    roundedCorners: false,
    show: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
    },
    width: cachedSize.width,
  });
  islandWindow = window;
  applyPreferences(window);

  window.webContents.on("did-finish-load", () => {
    // 页面重载后重新推送形态与悬停状态。
    broadcastMode = null;
    cursorInside = false;
    notifyMode(getWindowState().mode);
  });

  window.once("ready-to-show", () => {
    if (!isWindowAlive(window)) return;
    window.showInactive();
    window.setAlwaysOnTop(getPreferences().alwaysOnTop, "screen-saver");
    notifyPreferencesChanged();
    stopCursorPolling();
    cursorPollTimer = setInterval(pollCursor, CURSOR_POLL_MS);
  });

  window.webContents.on("did-fail-load", (_event, code, desc, validatedUrl) => {
    windowLog.error("[dynamic-island] failed to load", { code, desc, validatedUrl });
  });

  window.on("closed", () => {
    if (islandWindow === window) islandWindow = null;
    stopCursorPolling();
    notifyPreferencesChanged();
  });

  window.loadURL(islandUrl).catch((error) => {
    windowLog.error("[dynamic-island] failed to load", error);
  });
  return window;
}

function closeDynamicIslandWindow() {
  if (!isWindowAlive(islandWindow)) return false;
  islandWindow.destroy();
  islandWindow = null;
  stopCursorPolling();
  return true;
}

export function toggleDynamicIslandWindow() {
  if (isWindowAlive(islandWindow)) {
    closeDynamicIslandWindow();
    return false;
  }
  showDynamicIslandWindow();
  return true;
}

function notifyPreferencesChanged() {
  const current = getPreferences();
  for (const window of [mainWindow, islandWindow, getTrayWindow()]) {
    if (isWindowAlive(window)) window.webContents.send("dynamic-island:preferences", current);
  }
}

function updatePreferences(update: DynamicIslandPreferencesUpdate) {
  const { enabled, ...rest } = { ...getPreferences(), ...update };
  preferences = rest;
  writeUserDataJson(PREFERENCES_FILE, rest, windowLog);

  if (enabled !== isWindowAlive(islandWindow)) {
    if (enabled) showDynamicIslandWindow();
    else closeDynamicIslandWindow();
  }
  if (isWindowAlive(islandWindow)) {
    applyPreferences(islandWindow);
    if (update.snapCentered !== undefined && getWindowState().mode === "snapped") {
      // 切到居中时清掉记录的中心点；切到非居中时记住当前位置，下次启动按它恢复。
      const { x, width } = islandWindow.getBounds();
      setWindowState({
        mode: "snapped",
        x: update.snapCentered ? null : x + Math.round(width / 2),
        y: null,
      });
      setIslandBounds(computeSnappedPosition(getWindowDisplay()));
    }
  }
  notifyPreferencesChanged();
  return getPreferences();
}

function isDynamicIslandPreferencesUpdate(value: unknown): value is DynamicIslandPreferencesUpdate {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  return keys.every((key) => {
    const field = value[key];
    switch (key) {
      case "alwaysOnTop":
      case "enabled":
      case "nonOcclusive":
      case "showTranslation":
      case "snapCentered":
        return typeof field === "boolean";
      case "scale":
        return isValidScale(field);
      case "transition":
        return field === "bounce" || field === "smooth";
      default:
        return false;
    }
  });
}

function isDynamicIslandCommand(value: unknown): value is DynamicIslandCommand {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "set-dynamic-island-height":
      return typeof value.height === "number" && Number.isFinite(value.height);
    case "set-dynamic-island-shape":
      return typeof value.width === "number" && Number.isFinite(value.width) && value.width > 0;
    case "move-dynamic-island-window":
      return Number.isFinite(value.x) && Number.isFinite(value.y);
    case "save-dynamic-island-window":
      return true;
    default:
      return false;
  }
}

function isSender(window: BrowserWindow | null, event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  return isWindowAlive(window) && event.sender.id === window.webContents.id;
}

function isControllerSender(event: Electron.IpcMainEvent | IpcMainInvokeEvent) {
  return isSender(mainWindow, event) || isSender(getTrayWindow(), event);
}

function rejectUnexpectedSender(channel: string) {
  windowLog.warn(`[dynamic-island] rejected IPC from an unexpected renderer: ${channel}`);
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
  handleControl("dynamic-island:open", false, () => Boolean(showDynamicIslandWindow()));
  handleControl("dynamic-island:close", false, closeDynamicIslandWindow);
  handleControl("dynamic-island:toggle", false, toggleDynamicIslandWindow);

  ipcMain.handle("dynamic-island:get-preferences", (event) => {
    if (!isControllerSender(event) && !isSender(islandWindow, event)) {
      rejectUnexpectedSender("dynamic-island:get-preferences");
      return null;
    }
    return getPreferences();
  });

  ipcMain.handle("dynamic-island:get-mode", (event) => {
    if (!isSender(islandWindow, event)) {
      rejectUnexpectedSender("dynamic-island:get-mode");
      return "snapped";
    }
    return getWindowState().mode;
  });

  ipcMain.handle("dynamic-island:update-preferences", (event, update: unknown) => {
    if (!isControllerSender(event)) {
      rejectUnexpectedSender("dynamic-island:update-preferences");
      return null;
    }
    if (!isDynamicIslandPreferencesUpdate(update)) {
      windowLog.warn("[dynamic-island] rejected invalid preferences update");
      return null;
    }
    return updatePreferences(update);
  });

  ipcMain.on("dynamic-island:command", (event, command: unknown) => {
    if (!isSender(islandWindow, event)) {
      rejectUnexpectedSender("dynamic-island:command");
      return;
    }
    if (!isDynamicIslandCommand(command)) {
      windowLog.warn("[dynamic-island] rejected invalid command");
      return;
    }
    switch (command.type) {
      case "set-dynamic-island-height":
        applyHeight(command.height);
        return;
      case "set-dynamic-island-shape":
        shapeWidth = command.width;
        applyShape();
        return;
      case "move-dynamic-island-window":
        moveIsland(command.x, command.y);
        return;
      case "save-dynamic-island-window":
        settleIsland();
        return;
    }
  });
}
