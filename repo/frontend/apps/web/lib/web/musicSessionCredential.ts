import type { MusicSessionMigrationEnvironment } from "@/types/musicSession";

const LEGACY_MUSIC_SESSION_STORAGE_KEY = "music_cookie";

let migrationPromise: Promise<boolean> | null = null;

/** Remove the credential format used before Browser/Electron CookieJar became authoritative. */
export function clearLegacyMusicSessionCredential() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_MUSIC_SESSION_STORAGE_KEY);
}

/**
 * Promote one legacy localStorage credential through the login refresh endpoint. The credential is
 * sent once in a POST body so it never enters request URLs; Backend's existing Set-Cookie response
 * then establishes the browser's native CookieJar session.
 */
export function migrateLegacyMusicSession(
  backendOrigin: string,
  timeoutMs: number,
  environment = getDefaultEnvironment(),
) {
  if (!environment) return Promise.resolve(false);
  const credential = environment.storage.getItem(LEGACY_MUSIC_SESSION_STORAGE_KEY)?.trim();
  if (!credential) return Promise.resolve(false);
  if (migrationPromise) return migrationPromise;

  migrationPromise = environment
    .fetch(new URL("/login/refresh", backendOrigin), {
      body: JSON.stringify({ cookie: credential }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
    })
    .then(async (response) => {
      if (!response.ok) return false;
      const payload = (await response.json()) as { code?: unknown };
      if (payload.code !== 200) return false;
      environment.storage.removeItem(LEGACY_MUSIC_SESSION_STORAGE_KEY);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      migrationPromise = null;
    });

  return migrationPromise;
}

function getDefaultEnvironment(): MusicSessionMigrationEnvironment | null {
  if (typeof window === "undefined") return null;
  return {
    fetch: (input, init) => fetch(input, init),
    storage: window.localStorage,
  };
}
