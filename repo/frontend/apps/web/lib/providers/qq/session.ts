/**
 * The QQ Music session token, stored apart from NetEase's `music_cookie` so both accounts stay
 * signed in and switching back never needs a new scan. Only the opaque `qqmusic_session` token
 * the QQ backend hands out is kept; the QQ credential itself stays inside the backend.
 */
export const QQ_SESSION_STORAGE_KEY = "scopify:qq-session";
export const QQ_SESSION_CHANGED_EVENT = "scopify:qq-session-changed";

/** Cookie name the QQ backend issues the token under, also accepted in `?cookie=`. */
export const QQ_SESSION_COOKIE_NAME = "qqmusic_session";

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    /* Storage can be unavailable. */
  }
  return null;
}

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QQ_SESSION_CHANGED_EVENT));
}

export function getQqSessionToken(): string | null {
  return getStorage()?.getItem(QQ_SESSION_STORAGE_KEY)?.trim() || null;
}

export function saveQqSessionToken(token: string) {
  const storage = getStorage();
  const value = token.trim();
  if (!storage || !value) return;
  storage.setItem(QQ_SESSION_STORAGE_KEY, value);
  notifyChanged();
}

export function clearQqSessionToken() {
  const storage = getStorage();
  if (!storage || storage.getItem(QQ_SESSION_STORAGE_KEY) === null) return;
  storage.removeItem(QQ_SESSION_STORAGE_KEY);
  notifyChanged();
}

/** Calls back on token changes in this window and in other windows (the Desktop login window). */
export function subscribeQqSession(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === QQ_SESSION_STORAGE_KEY) onChange();
  };
  window.addEventListener(QQ_SESSION_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(QQ_SESSION_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reads the token out of the `qqmusic_session=<token>` string `/login/qr/check` answers with. */
export function qqSessionTokenFromCookie(cookie: string | undefined): string | null {
  if (!cookie) return null;
  for (const entry of cookie.split(";")) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    if (entry.slice(0, separator).trim() === QQ_SESSION_COOKIE_NAME) {
      return entry.slice(separator + 1).trim() || null;
    }
  }
  return null;
}
