import { ipcMain } from "electron";
import { ipcLog } from "@main/utils/logger";
import {
  clearInstalledMusicSessionCookies,
  installMusicSessionCookies,
  readMusicSessionCookie,
  saveMusicSessionCookie,
} from "@main/utils/musicCookieStore";

/** 注册音乐后端会话凭据的安全持久化和 Cookie 同步。 */
export function registerAuthenticationIpc() {
  ipcMain.handle("set-music-cookie", async (_event, cookieStr: string, backendOrigin: string) => {
    try {
      const value = cookieStr.trim();
      if (!value) {
        await clearInstalledMusicSessionCookies(backendOrigin);
        return true;
      }
      const installed = await installMusicSessionCookies(value, backendOrigin);
      if (!installed) return false;
      saveMusicSessionCookie(value);
      ipcLog.info("[IPC] set-music-cookie success");
      return true;
    } catch (error) {
      ipcLog.error("[IPC] set-music-cookie failed", error);
      throw error;
    }
  });
  // 仅供旧 Renderer 完成升级迁移；新请求不得读取凭据或手动注入 Cookie。
  ipcMain.on("get-music-cookie", (event) => {
    event.returnValue = readMusicSessionCookie();
  });
}
