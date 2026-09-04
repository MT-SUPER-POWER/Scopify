import { ipcMain, shell, type BrowserWindow } from "electron";
import type { RendererLogEvent } from "@scopify/desktop-contract";
import { getCurrentLogFilePath, getLogDirectory, ipcLog, rendererLog } from "@main/utils/logger";
import { isMainRenderer } from "./sender";

let loggingIpcRegistered = false;
let authorizedMainWindow: BrowserWindow | null = null;

/** 注册 Renderer 日志写入与日志文件打开能力。 */
export function registerLoggingIpc(mainWindow: BrowserWindow | null) {
  authorizedMainWindow = mainWindow;
  if (loggingIpcRegistered) return;
  loggingIpcRegistered = true;

  ipcMain.handle("logger:write", (event, payload: RendererLogEvent) => {
    return writeRendererLog(event, payload);
  });
  ipcMain.handle("logger:get-directory", () => getLogDirectory());
  ipcMain.handle("logger:open-current", async (event) => {
    if (!isMainRenderer(event, authorizedMainWindow)) return false;
    const error = await shell.openPath(getCurrentLogFilePath());
    if (error) {
      ipcLog.warn("failed to open current log:", error);
      return false;
    }
    return true;
  });
  ipcMain.handle("logger:open-directory", async (event) => {
    if (!isMainRenderer(event, authorizedMainWindow)) return false;
    const error = await shell.openPath(getLogDirectory());
    if (error) {
      ipcLog.warn("failed to open log directory:", error);
      return false;
    }
    return true;
  });
  ipcMain.on("logger:preload-error", (event, payload: unknown) => {
    writeRendererLog(event, payload);
  });
}

function writeRendererLog(
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
  payload: unknown,
) {
  if (!isRendererLogEvent(payload)) return false;

  const metadata = {
    ...(payload.metadata ?? {}),
    ...(payload.event ? { event: payload.event } : {}),
    ...(payload.id ? { id: payload.id } : {}),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
    ...(payload.traceId ? { traceId: payload.traceId } : {}),
    rendererId: event.sender.id,
  };

  rendererLog[payload.level](payload.message, metadata);
  return true;
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
