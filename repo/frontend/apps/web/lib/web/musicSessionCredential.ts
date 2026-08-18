const MUSIC_SESSION_STORAGE_KEY = "music_cookie";
const EMPTY = "";
let resolvedMusicSessionCredential: string | null | undefined;

/**
 * Session Credential Adapter for the NetEase backend contract.
 * Components, hooks, and endpoint functions use intent-level requests; the transport retrieves
 * and attaches this opaque credential only when a request explicitly requires it.
 */
export function getMusicSessionCredential() {
  if (typeof window === "undefined") return undefined;

  if (resolvedMusicSessionCredential === undefined) {
    resolvedMusicSessionCredential =
      typeof window.localStorage.getItem === "function"
        ? window.localStorage.getItem(MUSIC_SESSION_STORAGE_KEY)
        : null;
  }

  return resolvedMusicSessionCredential || undefined;
}

export function saveMusicSessionCredential(credential: string) {
  if (typeof window === "undefined") return;
  resolvedMusicSessionCredential = credential;
  if (credential) {
    window.localStorage.setItem(MUSIC_SESSION_STORAGE_KEY, credential);
    return;
  }
  resolvedMusicSessionCredential = EMPTY;
  window.localStorage.removeItem(MUSIC_SESSION_STORAGE_KEY);
}

export function clearMusicSessionCredential() {
  if (typeof window === "undefined") return;
  resolvedMusicSessionCredential = EMPTY;
  window.localStorage.removeItem(MUSIC_SESSION_STORAGE_KEY);
}

export function attachMusicSessionCredential(
  params: Record<string, unknown>,
  credential: string | undefined,
) {
  if (!credential || typeof params.cookie === "string") return params;
  return { ...params, cookie: credential };
}
