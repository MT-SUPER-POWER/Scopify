import { app } from "electron";
import fs from "node:fs";
import { join } from "node:path";

interface UserDataJsonLogger {
  error(...params: unknown[]): void;
  warn(...params: unknown[]): void;
}

/** 读取 userData 下的 JSON 文件；文件不存在或损坏时返回 null。 */
export function readUserDataJson(file: string, log: UserDataJsonLogger): unknown {
  try {
    return JSON.parse(fs.readFileSync(join(app.getPath("userData"), file), "utf-8")) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      log.warn(`failed to read ${file}`, error);
    }
    return null;
  }
}

export function writeUserDataJson(file: string, value: unknown, log: UserDataJsonLogger) {
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(join(app.getPath("userData"), file), JSON.stringify(value), "utf-8");
  } catch (error) {
    log.error(`failed to write ${file}`, error);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
