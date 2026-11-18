import type { MusicProvider } from "@scopify/music-domain/identity";

import { runtime } from "@/lib/runtime";
import { openLoginWindowOrFallback } from "@/lib/runtime/login";

/**
 * The platform the next login page should open on. The Desktop login window is opened without
 * a URL of our choosing, so the choice travels through storage and is read once.
 */
const LOGIN_PLATFORM_STORAGE_KEY = "scopify:login-platform";

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function isMusicProvider(value: unknown): value is MusicProvider {
  return value === "netease" || value === "qq";
}

/** The platform an entry asked the login page to open on, if any. */
export function peekRequestedLoginPlatform(): MusicProvider | null {
  const value = getStorage()?.getItem(LOGIN_PLATFORM_STORAGE_KEY);
  return isMusicProvider(value) ? value : null;
}

/** Forgets the request once the login page has read it. */
export function clearRequestedLoginPlatform() {
  getStorage()?.removeItem(LOGIN_PLATFORM_STORAGE_KEY);
}

/** Opens the login surface on one platform: the Desktop login window, or the login route. */
export function openLoginForPlatform(provider: MusicProvider, navigate: (url: string) => void) {
  getStorage()?.setItem(LOGIN_PLATFORM_STORAGE_KEY, provider);
  return openLoginWindowOrFallback(runtime.auth, () => navigate(`/login?provider=${provider}`));
}
