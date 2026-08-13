import type { BrowserWindow } from "electron";
import { next, pause, play, prev } from "../constants.js";

export function updateThumbarButtons(mainWindow: BrowserWindow, isPlaying: boolean) {
  mainWindow.setThumbarButtons([
    {
      tooltip: "Play Previous",
      icon: prev,
      click() {
        mainWindow.webContents.send("control-audio", "prev");
      },
    },
    {
      tooltip: isPlaying ? "Pause" : "Play",
      icon: isPlaying ? pause : play,
      click() {
        // 不要传具体的播放/暂停状态，防止由于 IPC 延迟导致状态两边对不上账
        mainWindow.webContents.send("control-audio", "toggle-play");
      },
    },
    {
      tooltip: "Play Next",
      icon: next,
      click() {
        mainWindow.webContents.send("control-audio", "next");
      },
    },
  ]);
}

export function initThumbarButtons(mainWindow: BrowserWindow) {
  updateThumbarButtons(mainWindow, false);
}
