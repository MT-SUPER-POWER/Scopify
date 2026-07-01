import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import { app, nativeImage } from "electron";
import log from "electron-log";
import { appConfigDefaultPath, appConfigPath, loadAppConfig } from "./config.js";

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
  log.error(`[Resource] Failed to load macOS window icon from: ${join(__iconsetDir, "icon_128x128.png")}`);
}

if (_nativeDockMac.isEmpty()) {
  log.error(`[Resource] Failed to load macOS dock icon from: ${join(__iconsetDir, "icon_512x512.png")}`);
}

export const __preloadScript = join(__dirname, "../main/preload.js");
const __rendererDir = join(__dirname, "../../renderer");
const appConfig = loadAppConfig();

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
const configStr = JSON.stringify(appConfig, null, 2)
  .split("\n")
  .map((line, i) => (i === 0 ? line : `              ${line}`))
  .join("\n");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LOGGER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const logsDir = app.isPackaged
  ? join(app.getPath("userData"), "logs")
  : join(process.cwd(), "logs");

const keepDays = appConfig.logging.keepDays || 7;

// 按天命名文件
log.transports.file.resolvePathFn = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 10);
  return join(logsDir, `${localISOTime}.log`);
};

log.transports.file.level = appConfig.logging.level;

if (appConfig.logging.format) {
  log.transports.console.format = appConfig.logging.format;
  log.transports.file.format = appConfig.logging.format;
}

// 清理过期日志
export function cleanOldLogs() {
  if (!fs.existsSync(logsDir)) return;
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  fs.readdirSync(logsDir).forEach((file: string) => {
    const filePath = join(logsDir, file);
    if (fs.statSync(filePath).mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      log.info(`Deleted old log: ${file}`);
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LOG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log.info(`\x1b[32m
  --------------------------------------------------
  ███████╗ ██████╗ ██████╗ ██████╗ ██╗███████╗██╗   ██╗
  ██╔════╝██╔════╝██╔═══██╗██╔══██╗██║██╔════╝╚██╗ ██╔╝
  ███████╗██║     ██║   ██║██████╔╝██║█████╗   ╚████╔╝
  ╚════██║██║     ██║   ██║██╔═══╝ ██║██╔══╝    ╚██╔╝
  ███████║╚██████╗╚██████╔╝██║     ██║██║        ██║
  ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝

  CREATED BY - MOMO
  --------------------------------------------------
  \x1b[32m`);

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
  appConfig,
  appConfigDefaultPath as __appConfigDefaultPath,
  appConfigPath as __appConfig,
  log as logger,
};
