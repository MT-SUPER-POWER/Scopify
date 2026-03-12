// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { join } from "path";
import { app } from "electron";
import log from "electron-log";
import { loadAppConfig } from "./config.js";
import fs from 'fs';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESOURCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const __logoIcon = join(__dirname, "../../resources/icon.ico");
const __preloadScript = join(__dirname, "../main/preload.js");
const __appConfigPath = join(__dirname, "../../config/app.config.yml");
const __appConfigDefaultPath = join(__dirname, "../../config/app.config.default.yml");
const appConfig = loadAppConfig();

// utils
const configStr = JSON.stringify(appConfig, null, 2)
  .split("\n")
  .map((line, i) => i === 0 ? line : `              ${line}`)
  .join("\n");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LOGGER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// NOTE: 配置日志

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

const __backendDir = join(__dirname, "../../backend/api-enhanced");
const __backendEntry = join(__backendDir, "app.js");

// NOTE: 通过环境变量传递后端配置，确保子进程能够正确读取到这些配置项
const __backendEnv = {
  ...process.env,
  PORT: `${appConfig.backend.port}`,
  HOST: appConfig.backend.host,
  NODE_ENV: "production",
  ELECTRON_RUN_AS_NODE: "1",
};


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
  Version:        ${app.getVersion()}
  Log Path:       ${logsDir}
  Env:            ${process.env.NODE_ENV}
  Preload:        ${__preloadScript}
  Packaged:       ${app.isPackaged}
  User Data:      ${app.getPath("userData")}
  Config Path:    ${__appConfigPath}
  Default:        ${__appConfigDefaultPath}
  App Config:     ${configStr}
  Backend Entry:  ${__backendEntry}
  --------------------------------------------------
`);

export {
  log as logger,
  __logoIcon,
  __preloadScript,
  __appConfigPath as __appConfig,
  __appConfigDefaultPath,
  __backendDir,
  __backendEntry,
  __backendEnv,
  appConfig
}
