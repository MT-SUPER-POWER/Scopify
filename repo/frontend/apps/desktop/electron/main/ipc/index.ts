import type { BrowserWindow } from "electron";
import type { McpRuntime } from "@main/capabilities/mcp";
import type { DesktopBackendController } from "@main/services/backend";
import type { createDiscordPresenceController } from "@main/services/discordPresence";
import { registerApplicationIpc } from "./application";
import { registerAuthenticationIpc } from "./authentication";
import { registerBackendIpc } from "./backend";
import { registerBridgeIpc } from "./bridge";
import { registerCacheIpc } from "./cache";
import { registerConfigurationIpc } from "./configuration";
import { registerDialogIpc } from "./dialog";
import { registerDiscordIpc } from "./discord";
import { registerLoggingIpc } from "./logging";
import { registerMediaIpc } from "./media";
import { registerMcpIpc } from "./mcp";
import { registerUpdaterIpc } from "./updater";
import { registerVideoExportIpc } from "./videoExport";
import { registerWindowIpc } from "./window";

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
  mcpRuntime: McpRuntime,
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
  registerConfigurationIpc(mainWindow, backendController, discordPresence, mcpRuntime);
  registerMcpIpc(mainWindow, mcpRuntime);
  registerCacheIpc(mainWindow);
  registerWindowIpc(mainWindow);
  registerAuthenticationIpc();
}
