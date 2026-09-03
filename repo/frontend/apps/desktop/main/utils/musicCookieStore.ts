import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { app, safeStorage } from "electron";

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
