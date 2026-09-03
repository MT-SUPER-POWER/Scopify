import { ipcMain, session } from "electron";
import { logger } from "../constants.js";
import {
  clearMusicSessionCookie,
  readMusicSessionCookie,
  saveMusicSessionCookie,
} from "../utils/musicCookieStore.js";

/** 注册音乐后端会话凭据的安全持久化和 Cookie 同步。 */
export function registerAuthenticationIpc() {
  ipcMain.handle("set-music-cookie", async (_event, cookieStr: string, backendOrigin: string) => {
    try {
      const musicUMatch = cookieStr.match(/MUSIC_U=([^;]+)/);
      const value = musicUMatch ? musicUMatch[1] : cookieStr;
      const persistedValue = musicUMatch ? `MUSIC_U=${value}` : value;
      if (!value) clearMusicSessionCookie();
      else saveMusicSessionCookie(persistedValue);

      await session.defaultSession.cookies.set({
        url: parseAllowedBackendOrigin(backendOrigin),
        name: "MUSIC_U",
        value,
        path: "/",
        sameSite: "no_restriction",
        expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60,
      });
      logger.info("[IPC] set-music-cookie success");
      return true;
    } catch (error) {
      logger.error("[IPC] set-music-cookie failed", error);
      throw error;
    }
  });
  ipcMain.on("get-music-cookie", (event) => {
    event.returnValue = readMusicSessionCookie();
  });
}

function parseAllowedBackendOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Backend origin must use HTTP or HTTPS.");
  }
  return url.origin;
}
