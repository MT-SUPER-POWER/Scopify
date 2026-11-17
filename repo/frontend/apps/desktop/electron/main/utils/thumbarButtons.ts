import type { BrowserWindow } from "electron";
import { next, pause, play, prev } from "@main/constants";

const updatePlaybackStates = new WeakMap<BrowserWindow, (isPlaying: boolean) => void>();

function applyThumbarButtons(mainWindow: BrowserWindow, isPlaying: boolean) {
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

export function initThumbarButtons(mainWindow: BrowserWindow, hasTaskbarButton: () => boolean) {
  if (process.platform !== "win32") return;

  let isPlaying = false;
  let hidden = !mainWindow.isVisible();
  const replay = () => {
    if (!hidden && !mainWindow.isDestroyed() && hasTaskbarButton()) {
      applyThumbarButtons(mainWindow, isPlaying);
    }
  };

  // Hiding removes the taskbar button. Minimizing keeps it, even though isVisible() is false.
  mainWindow.on("hide", () => {
    hidden = true;
  });
  mainWindow.on("show", () => {
    hidden = false;
    replay();
  });
  mainWindow.on("restore", replay);
  updatePlaybackStates.set(mainWindow, (nextIsPlaying) => {
    isPlaying = nextIsPlaying;
    replay();
  });
}

export function updateThumbarButtons(mainWindow: BrowserWindow, isPlaying: boolean) {
  updatePlaybackStates.get(mainWindow)?.(isPlaying);
}
