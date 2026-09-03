import { ipcMain } from "electron";
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  quitAndInstallUpdate,
} from "../services/updater.js";

/** 注册更新状态查询与显式更新命令。自动检查仍由应用生命周期负责调度。 */
export function registerUpdaterIpc() {
  ipcMain.handle("updater:get-status", () => getUpdateState());
  ipcMain.handle("updater:check", () => checkForUpdates());
  ipcMain.handle("updater:download", () => downloadUpdate());
  ipcMain.on("updater:quit-and-install", () => quitAndInstallUpdate());
}
