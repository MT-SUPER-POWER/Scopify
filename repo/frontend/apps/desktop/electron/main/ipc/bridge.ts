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
  "login",
  "logs",
  "media-controls",
  "navigation",
  "playback-transport",
  "renderer-logging",
  "updates",
  "video-export",
  "window-controls",
] satisfies DesktopBridgeCapability[];

/** 注册 Renderer 用于协商 Desktop 协议版本与能力的握手接口。 */
export function registerBridgeIpc() {
  ipcMain.handle("bridge:get-info", () => ({
    capabilities: [...CAPABILITIES],
    desktopVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
  }));
}
