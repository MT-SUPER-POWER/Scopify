import { app, ipcMain } from "electron";
import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  type DesktopBridgeCapability,
} from "@scopify/desktop-contract";

const CAPABILITIES = [
  "app-lifecycle",
  "backend",
  "audio-feature-transport",
  "cache",
  "config",
  "developer-tools",
  "desktop-icons",
  "desktop-lyrics",
  "desktop-playback-wallpaper",
  "discord-presence",
  "dynamic-island",
  "login",
  "logs",
  "media-controls",
  "mcp",
  "navigation",
  "notifications",
  "playback-transport",
  "renderer-logging",
  "updates",
  "video-export",
  "window-controls",
] satisfies DesktopBridgeCapability[];

/** 注册 Renderer 用于协商 Desktop 协议版本与能力的握手接口。 */
export function registerBridgeIpc() {
  ipcMain.handle("bridge:get-info", () => ({
    // 任务栏歌词依赖 Windows 原生模块，其他平台不声明该能力。
    capabilities:
      process.platform === "win32"
        ? [...CAPABILITIES, "taskbar-lyric" satisfies DesktopBridgeCapability]
        : [...CAPABILITIES],
    desktopVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
  }));
}
