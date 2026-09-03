import { ipcMain, shell, type BrowserWindow } from "electron";
import type { RendererLogEvent } from "@scopify/desktop-contract";
import { getCurrentLogFilePath, getLogDirectory, logger } from "../constants.js";
import { isMainRenderer } from "./sender.js";

/** 注册 Renderer 日志写入与日志文件打开能力。 */
export function registerLoggingIpc(mainWindow: BrowserWindow | null) {
  ipcMain.handle("logger:write", (event, payload: RendererLogEvent) => {
    if (!isRendererLogEvent(payload)) return false;

    const metadata = payload.metadata
      ? { ...payload.metadata, rendererId: event.sender.id }
      : { rendererId: event.sender.id };
    if (payload.level === "debug") logger.debug(`[renderer] ${payload.message}`, metadata);
    else if (payload.level === "info") logger.info(`[renderer] ${payload.message}`, metadata);
    else if (payload.level === "warn") logger.warn(`[renderer] ${payload.message}`, metadata);
    else logger.error(`[renderer] ${payload.message}`, metadata);
    return true;
  });
  ipcMain.handle("logger:get-directory", () => getLogDirectory());
  ipcMain.handle("logger:open-current", async (event) => {
    if (!isMainRenderer(event, mainWindow)) return false;
    const error = await shell.openPath(getCurrentLogFilePath());
    if (error) {
      logger.warn("[logger] failed to open current log:", error);
      return false;
    }
    return true;
  });
  ipcMain.handle("logger:open-directory", async (event) => {
    if (!isMainRenderer(event, mainWindow)) return false;
    const error = await shell.openPath(getLogDirectory());
    if (error) {
      logger.warn("[logger] failed to open log directory:", error);
      return false;
    }
    return true;
  });
}

function isRendererLogEvent(value: unknown): value is RendererLogEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<RendererLogEvent>;
  return (
    typeof event.message === "string" &&
    (event.level === "debug" ||
      event.level === "info" ||
      event.level === "warn" ||
      event.level === "error")
  );
}
