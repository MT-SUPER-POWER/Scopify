import fs from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import log from "electron-log";

import type { DesktopHostConfig } from "@scopify/desktop-contract";
import { loadDesktopHostConfig } from "@main/store";
import { sanitizeLogData } from "@main/utils/logText";

export { sanitizeLogData, sanitizeLogText } from "@main/utils/logText";

export const CURRENT_LOG_FILE_NAME = "main.log";
export const ARCHIVE_LOG_DIRECTORY_NAME = "archive";
export const SESSION_SHUTDOWN_MARKER = "[session] shutdown";

const RECOVERY_MARKER = "[session] previous session ended unexpectedly";
const RECENT_LOG_TAIL_BYTES = 4096;

/** 是否处于开发环境 */
export const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

/**
 * 解析生效的日志目录：
 * 1. 若配置了自定义有效路径 customDir，优先使用该目录；
 * 2. 否则默认：生产环境位于系统 C 盘 userData/logs，开发模式位于项目根目录 logs
 */
export function resolveLogsDir(customDir?: string): string {
  if (customDir && customDir.trim()) {
    return customDir.trim();
  }
  return app.isPackaged ? join(app.getPath("userData"), "logs") : join(process.cwd(), "logs");
}

let activeLoggingConfig: DesktopHostConfig["logging"] = loadDesktopHostConfig().logging;

/** 当前生效的日志根目录 */
export let logsDir = resolveLogsDir(activeLoggingConfig.dir);
let currentLogPath = getCurrentLogPath(logsDir);
const defaultFileTransforms = [...log.transports.file.transforms];

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** 获取当前会话日志绝对路径 */
export function getCurrentLogPath(baseLogsDir: string): string {
  return join(baseLogsDir, CURRENT_LOG_FILE_NAME);
}

export function formatLogTimestamp(date: Date): string {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    formatLogTime(date),
  ].join("_");
}

function formatLogTime(date: Date): string {
  return `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}-${pad(date.getMilliseconds(), 3)}`;
}

function getArchiveDirectory(baseLogsDir: string, date: Date): string {
  return join(
    baseLogsDir,
    ARCHIVE_LOG_DIRECTORY_NAME,
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  );
}

function getAvailableArchivePath(baseLogsDir: string, date: Date): string {
  const archiveDirectory = getArchiveDirectory(baseLogsDir, date);
  const baseName = formatLogTime(date);
  let suffix = 0;
  let candidate = join(archiveDirectory, `${baseName}.log`);

  while (fs.existsSync(candidate)) {
    suffix += 1;
    candidate = join(archiveDirectory, `${baseName}-${suffix}.log`);
  }

  return candidate;
}

/**
 * 将已存在的单次会话日志文件归档至 archive/YYYY-MM-DD/ 目录
 */
export function archiveLogFile(
  filePath: string,
  baseLogsDir: string,
  timestamp = new Date(),
): string | null {
  if (!fs.existsSync(filePath)) return null;

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) return null;

  const archivePath = getAvailableArchivePath(baseLogsDir, timestamp);
  fs.mkdirSync(getArchiveDirectory(baseLogsDir, timestamp), { recursive: true });
  fs.renameSync(filePath, archivePath);
  return archivePath;
}

function appendRecoveryMarker(filePath: string, timestamp: Date): void {
  const fileDescriptor = fs.openSync(filePath, "r");
  let tail = "";
  try {
    const stat = fs.fstatSync(fileDescriptor);
    const start = Math.max(0, stat.size - RECENT_LOG_TAIL_BYTES);
    const buffer = Buffer.alloc(stat.size - start);
    fs.readSync(fileDescriptor, buffer, 0, buffer.length, start);
    tail = buffer.toString("utf8");
  } finally {
    fs.closeSync(fileDescriptor);
  }

  if (tail.includes(SESSION_SHUTDOWN_MARKER) || tail.includes(RECOVERY_MARKER)) return;

  fs.appendFileSync(
    filePath,
    `\n[${formatLogTimestamp(timestamp)}] [warn] ${RECOVERY_MARKER}\n`,
    "utf8",
  );
}

/**
 * 每次启动新会话时准备日志文件：
 * 扫描上一会话末尾是否存在正常关闭标记，若缺失则追加异常中断标记，并归档旧日志
 */
export function prepareLogSession(baseLogsDir: string, now = new Date()): string {
  fs.mkdirSync(baseLogsDir, { recursive: true });
  const logPath = getCurrentLogPath(baseLogsDir);

  if (fs.existsSync(logPath)) {
    const stat = fs.statSync(logPath);
    if (stat.isFile() && stat.size > 0) {
      appendRecoveryMarker(logPath, now);
      archiveLogFile(logPath, baseLogsDir, new Date(stat.mtimeMs || now.getTime()));
    } else if (stat.isFile()) {
      fs.truncateSync(logPath, 0);
    }
  }

  for (const entry of fs.readdirSync(baseLogsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".log") || entry.name === CURRENT_LOG_FILE_NAME)
      continue;
    const legacyPath = join(baseLogsDir, entry.name);
    const legacyTime = new Date(fs.statSync(legacyPath).mtimeMs || now.getTime());
    archiveLogFile(legacyPath, baseLogsDir, legacyTime);
  }

  fs.closeSync(fs.openSync(logPath, "a"));
  return logPath;
}

function cleanDirectory(directoryPath: string, cutoff: number): number {
  if (!fs.existsSync(directoryPath)) return 0;

  let deletedCount = 0;
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      deletedCount += cleanDirectory(entryPath, cutoff);
      if (fs.readdirSync(entryPath).length === 0) fs.rmdirSync(entryPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".log") && fs.statSync(entryPath).mtimeMs < cutoff) {
      fs.unlinkSync(entryPath);
      deletedCount += 1;
    }
  }

  return deletedCount;
}

/**
 * 清理指定天数之前的历史归档日志（仅清理 archive/ 目录，永不删除当前的 main.log）
 */
export function cleanArchivedLogs(baseLogsDir: string, keepDays: number, now = new Date()): number {
  const archiveDirectory = join(baseLogsDir, ARCHIVE_LOG_DIRECTORY_NAME);
  const cutoff = now.getTime() - Math.max(1, keepDays) * 24 * 60 * 60 * 1000;
  return cleanDirectory(archiveDirectory, cutoff);
}

/** 获取当前日志存储目录 */
export function getLogDirectory(): string {
  return logsDir;
}

/** 获取当前主日志文件绝对路径 */
export function getCurrentLogFilePath(): string {
  return currentLogPath;
}

/** 清理过期日志 */
export function cleanOldLogs(): number {
  const deletedCount = cleanArchivedLogs(logsDir, activeLoggingConfig.keepDays);
  if (deletedCount > 0) {
    coreLog.info(`[logger] deleted ${deletedCount} expired archived log(s)`);
  }
  return deletedCount;
}

/**
 * 配置并更新日志传输规则
 */
export function configureLogging(loggingConfig: DesktopHostConfig["logging"]): void {
  activeLoggingConfig = loggingConfig;

  // 文件输出配置
  log.transports.file.resolvePathFn = () => currentLogPath;
  log.transports.file.archiveLogFn = (file) => {
    archiveLogFile(file.toString(), logsDir);
  };
  log.transports.file.level = loggingConfig.level;
  log.transports.file.maxSize = (loggingConfig.maxSizeMB || 2) * 1024 * 1024;
  log.transports.file.transforms = [...defaultFileTransforms, ({ data }) => sanitizeLogData(data)];

  // 控制台输出配置：启用终端彩色样式与环境分级
  log.transports.console.useStyles = true;
  log.transports.console.level = isDev
    ? "debug"
    : loggingConfig.level === "debug"
      ? "debug"
      : "warn";

  if (loggingConfig.format) {
    log.transports.console.format = loggingConfig.format;
    log.transports.file.format = loggingConfig.format;
  }
}

/**
 * 初始化日志系统（在应用启动最早阶段调用）
 */
export function initLogger(customConfig?: DesktopHostConfig["logging"]): void {
  activeLoggingConfig = customConfig || loadDesktopHostConfig().logging;
  logsDir = resolveLogsDir(activeLoggingConfig.dir);
  currentLogPath = prepareLogSession(logsDir);
  configureLogging(activeLoggingConfig);

  // 全局未捕获异常与 Promise rejection 捕获落盘
  log.errorHandler.startCatching();

  // 兜底接管原生 console，防止第三方库日志丢失
  const consoleScope = log.scope("console");
  console.log = consoleScope.log.bind(consoleScope);
  console.info = consoleScope.info.bind(consoleScope);
  console.warn = consoleScope.warn.bind(consoleScope);
  console.error = consoleScope.error.bind(consoleScope);

  cleanOldLogs();

  coreLog.info(
    `[logger] initialized (${isDev ? "development" : "production"}), logsDir: ${logsDir}`,
  );
}

// ──────────────── 分作用域 Logger 导出 ────────────────

export const coreLog = log.scope("core");
export const ipcLog = log.scope("ipc");
export const trayLog = log.scope("tray");
export const windowLog = log.scope("window");
export const backendLog = log.scope("backend");
export const wallpaperLog = log.scope("wallpaper");
export const brokerLog = log.scope("broker");
export const rendererLog = log.scope("renderer");
export const updaterLog = log.scope("updater");
export const discordLog = log.scope("discord");
export const sessionLog = log.scope("session");
export const proxyLog = log.scope("proxy");
export const desktopIconsLog = log.scope("desktop-icons");
