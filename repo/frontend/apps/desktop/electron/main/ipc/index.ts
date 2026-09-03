import type { BrowserWindow } from "electron";
import type { DesktopBackendController } from "@main/services/backend";
import type { createDiscordPresenceController } from "@main/services/discordPresence";
import { registerApplicationIpc } from "./application.js";
import { registerAuthenticationIpc } from "./authentication.js";
import { registerBackendIpc } from "./backend.js";
import { registerBridgeIpc } from "./bridge.js";
import { registerCacheIpc } from "./cache.js";
import { registerConfigurationIpc } from "./configuration.js";
import { registerDialogIpc } from "./dialog.js";
import { registerDiscordIpc } from "./discord.js";
import { registerLoggingIpc } from "./logging.js";
import { registerMediaIpc } from "./media.js";
import { registerUpdaterIpc } from "./updater.js";
import { registerVideoExportIpc } from "./videoExport.js";
import { registerWindowIpc } from "./window.js";

/**
 * 注册 Main 进程公开给 preload 的全部 IPC adapter。
 *
 * 这里仅负责组装；每个文件对应一种业务能力，参数校验和发送者授权留在各自 adapter，
 * 实际行为交由 window、service 或 capability 模块完成。
 */
export function registerIpcHandlers(
  mainWindow: BrowserWindow | null,
  discordPresence: ReturnType<typeof createDiscordPresenceController>,
  backendController: DesktopBackendController,
) {
  registerBridgeIpc();
  registerBackendIpc(mainWindow, backendController);
  registerLoggingIpc(mainWindow);
  registerApplicationIpc(mainWindow);
  registerMediaIpc(mainWindow);
  registerDiscordIpc(discordPresence);
  registerUpdaterIpc();
  registerDialogIpc(mainWindow);
  registerVideoExportIpc(mainWindow);
  registerConfigurationIpc(mainWindow, backendController, discordPresence);
  registerCacheIpc(mainWindow);
  registerWindowIpc(mainWindow);
  registerAuthenticationIpc();
}
