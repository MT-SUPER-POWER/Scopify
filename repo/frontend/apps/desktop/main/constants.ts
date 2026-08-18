import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, nativeImage } from "electron";
import log from "electron-log";
import type { DesktopHostConfig } from "@scopify/desktop-contract";
import { appConfigDefaultPath, appConfigPath, loadDesktopHostConfig } from "./config.js";
import {
  archiveLogFile,
  cleanArchivedLogs,
  getCurrentLogPath,
  prepareLogSession,
  sanitizeLogData,
} from "./logging.js";

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LOGGER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const desktopConfig = loadDesktopHostConfig();
const logsDir = app.isPackaged
  ? join(app.getPath("userData"), "logs")
  : join(process.cwd(), "logs");
const currentLogPath = prepareLogSession(logsDir);
let activeLoggingConfig = desktopConfig.logging;
const defaultFileTransforms = [...log.transports.file.transforms];

export function getLogDirectory() {
  return logsDir;
}

export function getCurrentLogFilePath() {
  return currentLogPath;
}

export function configureLogging(loggingConfig: DesktopHostConfig["logging"]) {
  activeLoggingConfig = loggingConfig;
  log.transports.file.resolvePathFn = () => currentLogPath;
  log.transports.file.archiveLogFn = (file) => {
    archiveLogFile(file.toString(), logsDir);
  };
  log.transports.file.level = loggingConfig.level;
  log.transports.file.maxSize = loggingConfig.maxSizeMB * 1024 * 1024;
  log.transports.file.transforms = [...defaultFileTransforms, ({ data }) => sanitizeLogData(data)];

  if (loggingConfig.format) {
    log.transports.console.format = loggingConfig.format;
    log.transports.file.format = loggingConfig.format;
  }
}

configureLogging(activeLoggingConfig);

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

// ─── 按用途导出（消费方只关心用途，不关心格式）───

/** 窗口图标：macOS 用 128×128 PNG，其他平台用 .ico */
export const __iconWindow = process.platform === "darwin" ? _nativeWindowMac : _nativeIco;

/** macOS 程序坞（Dock）图标 */
export const __iconDock = _nativeDockMac;

/** 系统托盘图标（Windows 任务栏通知区域） */
export const __iconTray = _nativeIco;

if (_nativeIco.isEmpty()) {
  log.error(`[Resource] Failed to load ico icon from: ${__iconIcoPath}`);
}

if (_nativeWindowMac.isEmpty()) {
  log.error(
    `[Resource] Failed to load macOS window icon from: ${join(__iconsetDir, "icon_128x128.png")}`,
  );
}

if (_nativeDockMac.isEmpty()) {
  log.error(
    `[Resource] Failed to load macOS dock icon from: ${join(__iconsetDir, "icon_512x512.png")}`,
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
  log.error(`[Thumbar] Failed to load next icon: ${join(__picDir, "tray/next.png")}`);
}
if (pause.isEmpty()) {
  log.error(`[Thumbar] Failed to load pause icon: ${join(__picDir, "tray/pause.png")}`);
}
if (prev.isEmpty()) {
  log.error(`[Thumbar] Failed to load prev icon: ${join(__picDir, "tray/prev.png")}`);
}
if (play.isEmpty()) {
  log.error(`[Thumbar] Failed to load play icon: ${join(__picDir, "tray/play.png")}`);
}

// utils
const configStr = JSON.stringify(desktopConfig, null, 2)
  .split("\n")
  .map((line, i) => (i === 0 ? line : `              ${line}`))
  .join("\n");

export function cleanOldLogs() {
  const deletedCount = cleanArchivedLogs(logsDir, activeLoggingConfig.keepDays);
  if (deletedCount > 0) log.info(`[logger] deleted ${deletedCount} expired archived log(s)`);
  return deletedCount;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LOG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log.info(`
  --------------------------------------------------
  ███████╗ ██████╗ ██████╗ ██████╗ ██╗███████╗██╗   ██╗
  ██╔════╝██╔════╝██╔═══██╗██╔══██╗██║██╔════╝╚██╗ ██╔╝
  ███████╗██║     ██║   ██║██████╔╝██║█████╗   ╚████╔╝
  ╚════██║██║     ██║   ██║██╔═══╝ ██║██╔══╝    ╚██╔╝
  ███████║╚██████╗╚██████╔╝██║     ██║██║        ██║
  ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝

  CREATED BY - MOMO
  --------------------------------------------------
`);

log.info(`
  Version:        ${app.getVersion()}
  Log Path:       ${logsDir}
  Env:            ${process.env.NODE_ENV}
  Preload:        ${__preloadScript}
  Packaged:       ${app.isPackaged}
  User Data:      ${app.getPath("userData")}
  Config Path:    ${appConfigPath}
  Default:        ${appConfigDefaultPath}
  App Config:     ${configStr}
  Splash HTML:    ${__splashHtmlPath}
  Renderer Dir:   ${__rendererDir}
  PIC DIR:        ${__picDir}
  --------------------------------------------------
`);

export {
  desktopConfig,
  appConfigDefaultPath as __appConfigDefaultPath,
  appConfigPath as __appConfig,
  log as logger,
};
