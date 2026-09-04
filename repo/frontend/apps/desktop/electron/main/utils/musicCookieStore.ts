import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { app, safeStorage, session } from "electron";
import { parseMusicSessionCookieBundle } from "./musicSessionCookie";

const MUSIC_SESSION_COOKIE_STORE_FILE = "scopify-music-session.json";
const MUSIC_SESSION_COOKIE_STORE_VERSION = 1;

type StoredMusicSessionCookie = {
  version: number;
  encrypted: boolean;
  value: string;
};

const musicSessionCookieStorePath = join(app.getPath("userData"), MUSIC_SESSION_COOKIE_STORE_FILE);

export function readMusicSessionCookie(): string | null {
  const raw = readStore();
  if (!raw) return null;
  return parseStoredCookie(raw);
}

export function saveMusicSessionCookie(cookieValue: string) {
  writeStore(cookieValue);
}

export function clearMusicSessionCookie() {
  try {
    if (existsSync(musicSessionCookieStorePath)) unlinkSync(musicSessionCookieStorePath);
  } catch {
    // Best-effort persistence behavior for desktop-only recovery.
  }
}

/**
 * Import an aggregated NetEase Cookie/Set-Cookie string into Chromium's persistent CookieJar.
 * The backend origin deliberately replaces the upstream domain: requests target Scopify Backend,
 * which already maps its incoming cookies to the upstream NetEase request.
 */
export async function installMusicSessionCookies(cookieValue: string, backendOrigin: string) {
  const origin = parseBackendOrigin(backendOrigin);
  const cookies = parseMusicSessionCookieBundle(cookieValue);
  if (!cookies.some((cookie) => cookie.name === "MUSIC_U" && cookie.value)) return false;

  for (const cookie of cookies) {
    const cookieUrl = new URL(cookie.path, `${origin}/`).toString();
    if (!cookie.value || cookie.maxAge === 0) {
      await session.defaultSession.cookies.remove(cookieUrl, cookie.name);
      continue;
    }

    const expirationDate = resolveExpirationDate(cookie.maxAge, cookie.expiresAt);
    await session.defaultSession.cookies.set({
      url: cookieUrl,
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure ?? origin.startsWith("https://"),
      ...(cookie.sameSite ? { sameSite: cookie.sameSite } : {}),
      ...(expirationDate === undefined ? {} : { expirationDate }),
    });
  }
  await session.defaultSession.cookies.flushStore();
  return true;
}

/** Restore the legacy safeStorage value into Chromium before the Renderer starts requesting data. */
export async function restoreMusicSessionCookies(backendOrigin: string) {
  const cookieValue = readMusicSessionCookie();
  return cookieValue ? installMusicSessionCookies(cookieValue, backendOrigin) : false;
}

/** Clear both Chromium's active Backend cookies and the legacy encrypted recovery value. */
export async function clearInstalledMusicSessionCookies(backendOrigin: string) {
  const origin = parseBackendOrigin(backendOrigin);
  const cookies = await session.defaultSession.cookies.get({ domain: new URL(origin).hostname });
  await Promise.all(
    cookies.map((cookie) =>
      session.defaultSession.cookies.remove(
        new URL(cookie.path || "/", `${origin}/`).toString(),
        cookie.name,
      ),
    ),
  );
  await session.defaultSession.cookies.flushStore();
  clearMusicSessionCookie();
}

function parseStoredCookie(stored: StoredMusicSessionCookie): string | null {
  if (stored.encrypted) {
    if (!safeStorage.isEncryptionAvailable()) return null;
    try {
      return safeStorage.decryptString(Buffer.from(stored.value, "base64"));
    } catch {
      return null;
    }
  }

  return stored.value;
}

function readStore(): StoredMusicSessionCookie | null {
  try {
    if (!existsSync(musicSessionCookieStorePath)) return null;
    const raw = readFileSync(musicSessionCookieStorePath, "utf8");
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== MUSIC_SESSION_COOKIE_STORE_VERSION ||
      typeof parsed.value !== "string" ||
      typeof parsed.encrypted !== "boolean"
    ) {
      return null;
    }
    return {
      value: parsed.value,
      encrypted: parsed.encrypted,
      version: parsed.version,
    };
  } catch {
    return null;
  }
}

function writeStore(cookieValue: string) {
  try {
    const value = cookieValue.trim();
    if (!value) {
      clearMusicSessionCookie();
      return;
    }

    const encryptedPayload = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(value)
      : null;
    const shouldEncrypt = encryptedPayload !== null && encryptedPayload.toString("base64") !== "";
    const encoded = shouldEncrypt ? encryptedPayload.toString("base64") : value;
    const payload: StoredMusicSessionCookie = {
      encrypted: shouldEncrypt,
      value: encoded,
      version: MUSIC_SESSION_COOKIE_STORE_VERSION,
    };

    mkdirSync(dirname(musicSessionCookieStorePath), { recursive: true });
    writeFileSync(musicSessionCookieStorePath, JSON.stringify(payload), "utf8");
  } catch {
    // Best-effort persistence.
  }
}

function parseBackendOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Backend origin must use HTTP or HTTPS.");
  }
  return url.origin;
}

function resolveExpirationDate(maxAge: number | undefined, expiresAt: number | undefined) {
  if (maxAge !== undefined && maxAge > 0) return Date.now() / 1_000 + maxAge;
  return expiresAt === undefined ? undefined : expiresAt / 1_000;
}
