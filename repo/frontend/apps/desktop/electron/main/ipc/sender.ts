import type { BrowserWindow, IpcMainInvokeEvent } from "electron";

/**
 * 只允许主 Renderer 调用涉及文件系统、配置或窗口状态的高权限处理器。
 * 辅助窗口共享同一份 preload，因此不能仅凭频道名称信任消息来源。
 */
export function isMainRenderer(event: IpcMainInvokeEvent, mainWindow: BrowserWindow | null) {
  return Boolean(
    mainWindow && !mainWindow.isDestroyed() && event.sender.id === mainWindow.webContents.id,
  );
}
