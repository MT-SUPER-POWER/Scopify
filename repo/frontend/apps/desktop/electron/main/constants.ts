import { existsSync } from "node:fs";
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

/**
 * 解析 public 静态资源路径。
 * 无论开发环境还是生产打包环境，应用内的 public 均位于相对于 out/main 的 ../../public，
 * 在生产环境中随 app.asar 打包并通过 asarUnpack 解包到 app.asar.unpacked/public；
 * 同时提供 process.resourcesPath 兜底以防特殊宿主环境。
 */
export function publicAsset(...segments: string[]): string {
  const relative = join(__dirname, "../../public", ...segments);
  if (existsSync(relative)) return relative;
  if (app.isPackaged) {
    const unpacked = join(process.resourcesPath, "app.asar.unpacked", "public", ...segments);
    if (existsSync(unpacked)) return unpacked;
    const directInResources = join(process.resourcesPath, "public", ...segments);
    if (existsSync(directInResources)) return directInResources;
  }
  return relative;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SPLASH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const __splashHtmlPath = publicAsset("splash.html");
export const __splashHtmlDesc = `[SPLASH] Electron 启动页: ${__splashHtmlPath}`;

const desktopConfig = loadDesktopHostConfig();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ICON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── 文件路径（按格式区分底层资源）───
export const __iconIcoPath = publicAsset("icons", "icon.ico");
export const __iconIcnsPath = publicAsset("icons", "icon.icns");
const __iconsetDir = publicAsset("icons", "icon.iconset");
export const __iconNotificationPath = publicAsset("icons", "icon.iconset", "icon_256x256.png");

// ─── 底层 NativeImage（内部使用，不直接导出）───
const _nativeIco = nativeImage.createFromPath(__iconIcoPath);

/** macOS 窗口图标用 128×128 PNG（.icns 不被 Electron 运行时支持）*/
const _nativeWindowMac = nativeImage.createFromPath(join(__iconsetDir, "icon_128x128.png"));

/** macOS Dock 图标用 512×512 PNG（旧方案已验证可用）*/
const _nativeDockMac = nativeImage.createFromPath(join(__iconsetDir, "icon_512x512.png"));

/** 通知区域使用专门的小尺寸 PNG，避免 Windows 从单层 256px ICO 缩放失败。 */
const _nativeTray = nativeImage.createFromPath(
  existsSync(publicAsset("icons", "tray", "icon_32x32.png"))
    ? publicAsset("icons", "tray", "icon_32x32.png")
    : join(__iconsetDir, "icon_32x32.png"),
);

/** Windows/Linux 窗口高清回退 PNG 图标 */
const _nativeWindowPng = nativeImage.createFromPath(join(__iconsetDir, "icon_256x256.png"));

// ─── 按用途导出（消费方只关心用途，不关心格式）───

/** 窗口图标：macOS 用 128×128 PNG，其他平台用 .ico（若为空则回退至 256×256 PNG） */
export const __iconWindow =
  process.platform === "darwin"
    ? _nativeWindowMac
    : !_nativeIco.isEmpty()
      ? _nativeIco
      : _nativeWindowPng;

/** macOS 程序坞（Dock）图标 */
export const __iconDock = _nativeDockMac;

/** 系统托盘图标（Windows 任务栏通知区域） */
export const __iconTray = _nativeTray;

/** Validate native resources after Main logging has been initialized. */
export function validateDesktopResources() {
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
}

export const __preloadScript = join(__dirname, "../main/preload.js");
export const __rendererDir = join(__dirname, "../../renderer");

/** 渲染器使用的自定义协议 scheme，同步决定 electron-serve 注册的协议名及后端 CORS 白名单 */
export const RENDERER_SCHEME = "scopify";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ THUMBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const __thumbarDir = publicAsset("icons", "thumbar");

export const next = nativeImage.createFromPath(join(__thumbarDir, "next.png"));
export const pause = nativeImage.createFromPath(join(__thumbarDir, "pause.png"));
export const prev = nativeImage.createFromPath(join(__thumbarDir, "prev.png"));
export const play = nativeImage.createFromPath(join(__thumbarDir, "play.png"));

if (next.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load next icon: ${join(__thumbarDir, "next.png")}`);
}
if (pause.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load pause icon: ${join(__thumbarDir, "pause.png")}`);
}
if (prev.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load prev icon: ${join(__thumbarDir, "prev.png")}`);
}
if (play.isEmpty()) {
  coreLog.error(`[Thumbar] Failed to load play icon: ${join(__thumbarDir, "play.png")}`);
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
