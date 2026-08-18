import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  archiveLogFile,
  cleanArchivedLogs,
  getCurrentLogPath,
  prepareLogSession,
  sanitizeLogText,
} from "@/main/logging";

let temporaryDirectory: string | null = null;

afterEach(() => {
  if (temporaryDirectory) fs.rmSync(temporaryDirectory, { force: true, recursive: true });
  temporaryDirectory = null;
});

function createLogsDirectory() {
  temporaryDirectory = fs.mkdtempSync(join(tmpdir(), "scopify-logging-"));
  return temporaryDirectory;
}

describe("desktop log lifecycle", () => {
  test("sanitizes terminal control sequences without flattening carriage-return output", () => {
    expect(sanitizeLogText("\u001b[32mScopify\u001b[0m\rBackend\n")).toBe("Scopify\nBackend\n");
  });

  test("archives the previous main.log and marks interrupted sessions", () => {
    const logsDirectory = createLogsDirectory();
    const currentLogPath = getCurrentLogPath(logsDirectory);
    const previousSessionTime = new Date(2026, 7, 18, 14, 30, 0, 125);

    fs.writeFileSync(currentLogPath, "previous session\n", "utf8");
    fs.utimesSync(currentLogPath, previousSessionTime, previousSessionTime);

    prepareLogSession(logsDirectory, new Date(2026, 7, 18, 15, 0, 0, 0));

    const archiveDirectory = join(logsDirectory, "archive", "2026-08-18");
    const archivedFiles = fs.readdirSync(archiveDirectory);
    expect(archivedFiles).toHaveLength(1);
    expect(archivedFiles[0]).toMatch(/^14-30-00-125\.log$/);
    expect(fs.readFileSync(join(archiveDirectory, archivedFiles[0]), "utf8")).toContain(
      "previous session ended unexpectedly",
    );
    expect(fs.readFileSync(currentLogPath, "utf8")).toBe("");
  });

  test("does not add an interruption marker after a clean shutdown", () => {
    const logsDirectory = createLogsDirectory();
    const currentLogPath = getCurrentLogPath(logsDirectory);
    const previousSessionTime = new Date(2026, 7, 18, 14, 30, 0, 125);

    fs.writeFileSync(currentLogPath, "[session] shutdown\n", "utf8");
    fs.utimesSync(currentLogPath, previousSessionTime, previousSessionTime);

    prepareLogSession(logsDirectory, new Date(2026, 7, 18, 15, 0, 0, 0));

    const archivePath = join(logsDirectory, "archive", "2026-08-18", "14-30-00-125.log");
    expect(fs.readFileSync(archivePath, "utf8")).not.toContain("ended unexpectedly");
  });

  test("keeps same-millisecond rotations unique", () => {
    const logsDirectory = createLogsDirectory();
    const timestamp = new Date(2026, 7, 18, 14, 30, 0, 125);
    const firstLogPath = join(logsDirectory, "first.log");
    const secondLogPath = join(logsDirectory, "second.log");

    fs.writeFileSync(firstLogPath, "first\n", "utf8");
    fs.writeFileSync(secondLogPath, "second\n", "utf8");
    const firstArchivePath = archiveLogFile(firstLogPath, logsDirectory, timestamp);
    const secondArchivePath = archiveLogFile(secondLogPath, logsDirectory, timestamp);

    expect(firstArchivePath).toContain("14-30-00-125.log");
    expect(secondArchivePath).toContain("14-30-00-125-1.log");
  });

  test("cleans expired archives without touching main.log", () => {
    const logsDirectory = createLogsDirectory();
    const currentLogPath = getCurrentLogPath(logsDirectory);
    const archivedSourcePath = join(logsDirectory, "archived.log");
    const now = new Date(2026, 7, 18, 15, 0, 0, 0);

    fs.writeFileSync(currentLogPath, "current\n", "utf8");
    fs.writeFileSync(archivedSourcePath, "old archive\n", "utf8");
    const archivePath = archiveLogFile(
      archivedSourcePath,
      logsDirectory,
      new Date(2026, 7, 1, 12, 0, 0, 0),
    );
    fs.utimesSync(archivePath!, new Date(2026, 7, 1), new Date(2026, 7, 1));

    expect(cleanArchivedLogs(logsDirectory, 7, now)).toBe(1);
    expect(fs.existsSync(currentLogPath)).toBe(true);
    expect(fs.existsSync(archivePath!)).toBe(false);
  });
});
