import { ipcMain } from "electron";
import type { DiscordPresenceSnapshot } from "@scopify/desktop-contract";
import type { createDiscordPresenceController } from "../services/discordPresence.js";

/** 注册 Discord Rich Presence 的命令接口；连接生命周期由 controller 自己管理。 */
export function registerDiscordIpc(
  discordPresence: ReturnType<typeof createDiscordPresenceController>,
) {
  ipcMain.handle("discord-presence:get-status", () => discordPresence.getStatus());
  ipcMain.handle("discord-presence:test-connection", () => discordPresence.testConnection());
  ipcMain.handle("discord-presence:publish", (_event, snapshot: DiscordPresenceSnapshot) =>
    discordPresence.publishSnapshot(snapshot),
  );
}
