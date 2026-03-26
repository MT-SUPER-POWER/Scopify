// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SPLASH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 启动页 HTML 路径和内容统一管理
export const __splashHtmlPath = join(__dirname, "../../resources/splash.html");
export const __splashHtmlDesc = "[SPLASH] Electron 启动页: " + __splashHtmlPath;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { join } from "path";
import { app, nativeImage } from "electron";
import log from "electron-log";
import { appConfigDefaultPath, appConfigPath, loadAppConfig } from "./config.js";
import fs from 'fs';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESOURCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const __logoIconPath = app.isPackaged ?
  join(process.resourcesPath, "resources/icon.ico") :
  join(__dirname, "../../resources/icon.ico");

export const __logoIcon = nativeImage.createFromPath(__logoIconPath);

if (__logoIcon.isEmpty()) {
  log.error(`[Resource] Failed to load logo icon from: ${__logoIconPath}`);
}
export const __preloadScript = join(__dirname, "../main/preload.js");
const __rendererDir = join(__dirname, "../../renderer");
const appConfig = loadAppConfig();

const __picDir = app.isPackaged ?
  join(process.resourcesPath, "resources/pic") :
  join(__dirname, "../../resources/pic");

export const next = nativeImage.createFromPath(join(__picDir, "tray/next.png"));
export const pause = nativeImage.createFromPath(join(__picDir, "tray/pause.png"));
export const prev = nativeImage.createFromPath(join(__picDir, "tray/prev.png"));
export const play = nativeImage.createFromPath(join(__picDir, "tray/play.png"));

// utils
const configStr = JSON.stringify(appConfig, null, 2)
  .split("\n")
  .map((line, i) => i === 0 ? line : `              ${line}`)
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BACKEND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const __backendDir = app.isPackaged ?
  join(process.resourcesPath, "/backend/api-enhanced") :
  join(__dirname, "../../backend/api-enhanced");
const __backendEntry = join(__backendDir, "app.js");

// NOTE: 通过环境变量传递后端配置，确保子进程能够正确读取到这些配置项
const __backendEnv = {
  ...process.env,
  PORT: `${appConfig.backend.port}`,
  HOST: appConfig.backend.host,
  APP_CONFIG_PATH: appConfigPath,
  NODE_ENV: "production",
  ELECTRON_RUN_AS_NODE: "1",
};


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
  \x1b[32m`)

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
  Backend Entry:  ${__backendEntry}
  Splash HTML:    ${__splashHtmlPath}
  Renderer Dir:   ${__rendererDir}
  --------------------------------------------------
`);

export {
  log as logger,
  appConfigPath as __appConfig,
  appConfigDefaultPath as __appConfigDefaultPath,
  __backendDir,
  __backendEntry,
  __backendEnv,
  appConfig
}
