import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, nativeImage } from "electron";
import { appConfigDefaultPath, appConfigPath, loadDesktopHostConfig } from "@main/store";
import {
  cleanOldLogs,
  configureLogging,
  coreLog,
  getCurrentLogFilePath,
  getLogDirectory,
  ipcLog,
  logsDir,
  resolveLogsDir,
  trayLog,
} from "@main/utils/logger";

// ━━━━━━━━━━━━━━━━ ESM 路径兼容 ━━━━━━━━━━━━━━━━
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SPLASH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 启动页 HTML 路径和内容统一管理
export const __splashHtmlPath = app.isPackaged
  ? join(process.resourcesPath, "resources/splash.html")
  : join(__dirname, "../../resources/splash.html");

export const __splashHtmlDesc = `[SPLASH] Electron 启动页: ${__splashHtmlPath}`;

const desktopConfig = loadDesktopHostConfig();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ICON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── 文件路径（按格式区分底层资源）───
export const __iconIcoPath = app.isPackaged
  ? join(process.resourcesPath, "resources/icon.ico")
  : join(__dirname, "../../resources/icon.ico");

export const __iconIcnsPath = app.isPackaged
  ? join(process.resourcesPath, "resources/icon.icns")
  : join(__dirname, "../../resources/icon.icns");

const __iconsetDir = app.isPackaged
  ? join(process.resourcesPath, "resources/icon.iconset")
  : join(__dirname, "../../resources/icon.iconset");

// ─── 底层 NativeImage（内部使用，不直接导出）───
const _nativeIco = nativeImage.createFromPath(__iconIcoPath);

/** macOS 窗口图标用 128×128 PNG（.icns 不被 Electron 运行时支持）*/
const _nativeWindowMac = nativeImage.createFromPath(join(__iconsetDir, "icon_128x128.png"));

/** macOS Dock 图标用 512×512 PNG（旧方案已验证可用）*/
const _nativeDockMac = nativeImage.createFromPath(join(__iconsetDir, "icon_512x512.png"));

/** 通知区域使用专门的小尺寸 PNG，避免 Windows 从单层 256px ICO 缩放失败。 */
const _nativeTray = nativeImage.createFromPath(join(__iconsetDir, "icon_32x32.png"));

// ─── 按用途导出（消费方只关心用途，不关心格式）───

/** 窗口图标：macOS 用 128×128 PNG，其他平台用 .ico */
export const __iconWindow = process.platform === "darwin" ? _nativeWindowMac : _nativeIco;

/** macOS 程序坞（Dock）图标 */
export const __iconDock = _nativeDockMac;

/** 系统托盘图标（Windows 任务栏通知区域） */
export const __iconTray = _nativeTray;

if (_nativeIco.isEmpty()) {
  coreLog.error(`[Resource] Failed to load ico icon from: ${__iconIcoPath}`);
}

if (_nativeWindowMac.isEmpty()) {
  coreLog.error(
    `[Resource] Failed to load macOS window icon from: ${join(__iconsetDir, "icon_128x128.png")}`,
  );
}

if (_nativeDockMac.isEmpty()) {
  coreLog.error(
    `[Resource] Failed to load macOS dock icon from: ${join(__iconsetDir, "icon_512x512.png")}`,
  );
}

if (_nativeTray.isEmpty()) {
  coreLog.error(
    `[Resource] Failed to load system tray icon from: ${join(__iconsetDir, "icon_32x32.png")}`,
  );
}

export const __preloadScript = join(__dirname, "../main/preload.js");
export const __rendererDir = join(__dirname, "../../renderer");

const __picDir = app.isPackaged
  ? join(process.resourcesPath, "resources/pic")
  : join(__dirname, "../../resources/pic");

export const next = nativeImage.createFromPath(join(__picDir, "tray/next.png"));
export const pause = nativeImage.createFromPath(join(__picDir, "tray/pause.png"));
export const prev = nativeImage.createFromPath(join(__picDir, "tray/prev.png"));
export const play = nativeImage.createFromPath(join(__picDir, "tray/play.png"));

if (next.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load next icon: ${join(__picDir, "tray/next.png")}`);
}
if (pause.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load pause icon: ${join(__picDir, "tray/pause.png")}`);
}
if (prev.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load prev icon: ${join(__picDir, "tray/prev.png")}`);
}
if (play.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load play icon: ${join(__picDir, "tray/play.png")}`);
}

export {
  cleanOldLogs,
  configureLogging,
  coreLog,
  desktopConfig,
  getCurrentLogFilePath,
  getLogDirectory,
  ipcLog,
  logsDir,
  resolveLogsDir,
  trayLog,
  appConfigDefaultPath as __appConfigDefaultPath,
  appConfigPath as __appConfig,
};
