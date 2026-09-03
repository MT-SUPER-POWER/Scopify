import { ipcMain, type BrowserWindow } from "electron";
import { onDesktopLyricPlaybackStateChanged } from "@main/window/desktopLyric";
import { updateThumbarButtons } from "@main/utils/thumbarButtons";

/** 将主 Renderer 的播放状态同步给只负责系统呈现的桌面能力。 */
export function registerMediaIpc(mainWindow: BrowserWindow | null) {
  ipcMain.on("player-state-changed", (_event, { isPlaying }: { isPlaying: boolean }) => {
    if (mainWindow) updateThumbarButtons(mainWindow, isPlaying);
    onDesktopLyricPlaybackStateChanged(isPlaying);
  });
}
