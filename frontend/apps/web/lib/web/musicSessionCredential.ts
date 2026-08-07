const MUSIC_SESSION_STORAGE_KEY = "music_cookie";

/**
 * Session Credential Adapter for the NetEase backend contract.
 * Components, hooks, and endpoint functions use intent-level requests; the transport retrieves
 * and attaches this opaque credential only when a request explicitly requires it.
 */
export function getMusicSessionCredential() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(MUSIC_SESSION_STORAGE_KEY) ?? undefined;
}

export function saveMusicSessionCredential(credential: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUSIC_SESSION_STORAGE_KEY, credential);
}

export function clearMusicSessionCredential() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MUSIC_SESSION_STORAGE_KEY);
}

export function attachMusicSessionCredential(
  params: Record<string, unknown>,
  credential: string | undefined,
) {
  if (!credential || typeof params.cookie === "string") return params;
  return { ...params, cookie: credential };
}
