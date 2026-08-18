import fs from "node:fs";
import { join } from "node:path";

export const CURRENT_LOG_FILE_NAME = "main.log";
export const ARCHIVE_LOG_DIRECTORY_NAME = "archive";
export const SESSION_SHUTDOWN_MARKER = "[session] shutdown";

const RECOVERY_MARKER = "[session] previous session ended unexpectedly";
const RECENT_LOG_TAIL_BYTES = 4096;

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

export function getCurrentLogPath(logsDir: string) {
  return join(logsDir, CURRENT_LOG_FILE_NAME);
}

export function formatLogTimestamp(date: Date) {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    formatLogTime(date),
  ].join("_");
}

function formatLogTime(date: Date) {
  return `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}-${pad(date.getMilliseconds(), 3)}`;
}

function getArchiveDirectory(logsDir: string, date: Date) {
  return join(
    logsDir,
    ARCHIVE_LOG_DIRECTORY_NAME,
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  );
}

function getAvailableArchivePath(logsDir: string, date: Date) {
  const archiveDirectory = getArchiveDirectory(logsDir, date);
  const baseName = formatLogTime(date);
  let suffix = 0;
  let candidate = join(archiveDirectory, `${baseName}.log`);

  while (fs.existsSync(candidate)) {
    suffix += 1;
    candidate = join(archiveDirectory, `${baseName}-${suffix}.log`);
  }

  return candidate;
}

export function archiveLogFile(filePath: string, logsDir: string, timestamp = new Date()) {
  if (!fs.existsSync(filePath)) return null;

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) return null;

  const archivePath = getAvailableArchivePath(logsDir, timestamp);
  fs.mkdirSync(getArchiveDirectory(logsDir, timestamp), { recursive: true });
  fs.renameSync(filePath, archivePath);
  return archivePath;
}

function appendRecoveryMarker(filePath: string, timestamp: Date) {
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
 * Archives the previous main.log before the first logger write of a new process.
 * A missing shutdown marker means the previous process was interrupted.
 */
export function prepareLogSession(logsDir: string, now = new Date()) {
  fs.mkdirSync(logsDir, { recursive: true });
  const currentLogPath = getCurrentLogPath(logsDir);

  if (fs.existsSync(currentLogPath)) {
    const stat = fs.statSync(currentLogPath);
    if (stat.isFile() && stat.size > 0) {
      appendRecoveryMarker(currentLogPath, now);
      archiveLogFile(currentLogPath, logsDir, new Date(stat.mtimeMs || now.getTime()));
    } else if (stat.isFile()) {
      fs.truncateSync(currentLogPath, 0);
    }
  }

  for (const entry of fs.readdirSync(logsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".log") || entry.name === CURRENT_LOG_FILE_NAME)
      continue;
    const legacyPath = join(logsDir, entry.name);
    const legacyTime = new Date(fs.statSync(legacyPath).mtimeMs || now.getTime());
    archiveLogFile(legacyPath, logsDir, legacyTime);
  }

  fs.closeSync(fs.openSync(currentLogPath, "a"));
  return currentLogPath;
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

/** Cleans only archived files; the current main.log is never a cleanup target. */
export function cleanArchivedLogs(logsDir: string, keepDays: number, now = new Date()) {
  const archiveDirectory = join(logsDir, ARCHIVE_LOG_DIRECTORY_NAME);
  const cutoff = now.getTime() - Math.max(1, keepDays) * 24 * 60 * 60 * 1000;
  return cleanDirectory(archiveDirectory, cutoff);
}
