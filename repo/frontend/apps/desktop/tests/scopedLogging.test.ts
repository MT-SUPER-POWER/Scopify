import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MAIN_PROCESS_DIRECTORY = resolve(import.meta.dir, "../electron/main");
const DEFAULT_LOG_CALL =
  /(?<![\w.])(?:log|logger)\.(?:debug|error|fatal|info|silly|trace|verbose|warn)\s*\(/;

function collectTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

test("Electron Main emits application messages through scoped loggers", () => {
  const violations = collectTypeScriptFiles(MAIN_PROCESS_DIRECTORY).filter((file) =>
    DEFAULT_LOG_CALL.test(readFileSync(file, "utf8")),
  );

  expect(violations).toEqual([]);

  const loggerSource = readFileSync(join(MAIN_PROCESS_DIRECTORY, "utils/logger.ts"), "utf8");
  expect(loggerSource).not.toContain("export const logger =");
});
