export const MUSIC_SESSION_STORAGE_KEY = "music_cookie";

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

/** 保存音乐会话凭据到 localStorage */
export function saveMusicSessionCredential(cookie: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(MUSIC_SESSION_STORAGE_KEY, cookie.trim());
}

/** 读取 localStorage 中保存的音乐会话凭据 */
export function getMusicSessionCredential(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(MUSIC_SESSION_STORAGE_KEY)?.trim() || null;
}

/** 清除 localStorage 中保存的音乐会话凭据 */
export function clearMusicSessionCredential() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(MUSIC_SESSION_STORAGE_KEY);
}

/** 兼容旧命名 */
export const clearLegacyMusicSessionCredential = clearMusicSessionCredential;

/** 将音乐会话凭据附加到请求参数对象中 */
export function attachMusicSessionCredential(
  params: Record<string, unknown>,
  credential: string | null,
): Record<string, unknown> {
  if (!credential) return params;
  return { ...params, cookie: credential };
}
