import { writeFile } from "node:fs/promises";
import { dialog, ipcMain, screen, type BrowserWindow } from "electron";
import type { DesktopVideoExportSaveRequest } from "@scopify/desktop-contract";
import { resolveVideoExportWindowBounds } from "@main/window/videoExportWindow";
import { isMainRenderer } from "./sender";

/**
 * 注册视频导出期间的主窗口整形和文件写入能力。
 * 恢复快照只属于一次导出会话，重复 prepare 不得覆盖最初的窗口状态。
 */
export function registerVideoExportIpc(mainWindow: BrowserWindow | null) {
  let restoreState: {
    bounds: Electron.Rectangle;
    isFullScreen: boolean;
    isMaximized: boolean;
  } | null = null;

  ipcMain.handle("video-export:get-capture-source", (event) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return null;
    return { id: mainWindow.getMediaSourceId(), name: mainWindow.getTitle() };
  });

  ipcMain.handle("video-export:prepare-window", (event, size: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return false;
    if (!isVideoExportSize(size)) return false;
    restoreState ??= {
      bounds: mainWindow.getBounds(),
      isFullScreen: mainWindow.isFullScreen(),
      isMaximized: mainWindow.isMaximized(),
    };
    if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    const currentBounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching(restoreState.bounds);
    mainWindow.setBounds(
      resolveVideoExportWindowBounds({
        currentBounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        target: size,
      }),
      false,
    );
    mainWindow.focus();
    return true;
  });

  ipcMain.handle("video-export:restore-window", (event) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return false;
    if (restoreState) {
      const state = restoreState;
      restoreState = null;
      mainWindow.setBounds(state.bounds, false);
      if (state.isFullScreen) mainWindow.setFullScreen(true);
      else if (state.isMaximized) mainWindow.maximize();
    }
    return true;
  });

  ipcMain.handle("video-export:select-file", async (event, request: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !isVideoExportSaveRequest(request)) return null;
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: request.defaultPath,
      filters: [{ name: request.formatName, extensions: [request.extension] }],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle("video-export:write-file", async (event, filePath: unknown, data: unknown) => {
    if (
      !isMainRenderer(event, mainWindow) ||
      typeof filePath !== "string" ||
      !(data instanceof ArrayBuffer)
    ) {
      return false;
    }
    await writeFile(filePath, Buffer.from(data));
    return true;
  });
}

function isVideoExportSize(value: unknown): value is { width: number; height: number } {
  if (!value || typeof value !== "object") return false;
  const size = value as { width?: unknown; height?: unknown };
  return [size.width, size.height].every(
    (dimension) =>
      typeof dimension === "number" &&
      Number.isInteger(dimension) &&
      dimension >= 240 &&
      dimension <= 4320,
  );
}

function isVideoExportSaveRequest(value: unknown): value is DesktopVideoExportSaveRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<DesktopVideoExportSaveRequest>;
  return (
    typeof request.defaultPath === "string" &&
    typeof request.formatName === "string" &&
    (request.extension === "mp4" || request.extension === "webm")
  );
}
