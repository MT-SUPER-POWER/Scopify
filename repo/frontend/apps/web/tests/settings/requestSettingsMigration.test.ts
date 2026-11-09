import { expect, test } from "bun:test";

import {
  LEGACY_WEB_SETTINGS_KEYS,
  migrateLegacyRequestSettings,
  WEB_REQUEST_SETTINGS_KEY,
} from "@/lib/web/http/storedSettings";
import { webConfigSchema } from "@/types/settings/config";

function memoryStorage(entries: Record<string, unknown> = {}) {
  const values = new Map(
    Object.entries(entries).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

function migrated(storage: ReturnType<typeof memoryStorage>) {
  return JSON.parse(storage.getItem(WEB_REQUEST_SETTINGS_KEY) ?? "null") as unknown;
}

const neteaseAddress = { host: "music.example.com", port: 8443, protocol: "https" } as const;
const qqAddress = { host: "10.0.0.2", port: 3300, protocol: "http" } as const;

test("maps the legacy flat keys into the per-platform shape and drops them", () => {
  const storage = memoryStorage({
    [LEGACY_WEB_SETTINGS_KEYS.backend]: neteaseAddress,
    [LEGACY_WEB_SETTINGS_KEYS.qqBackend]: qqAddress,
    [LEGACY_WEB_SETTINGS_KEYS.network]: { timeout: 5000, randomCNIP: "true" },
  });

  migrateLegacyRequestSettings(storage);

  expect(migrated(storage)).toEqual({
    backend: { netease: neteaseAddress, qq: qqAddress },
    network: { timeout: 5000 },
    netease: { randomCNIP: "true" },
  });
  for (const key of Object.values(LEGACY_WEB_SETTINGS_KEYS)) {
    expect(storage.getItem(key)).toBeNull();
  }
});

test("keeps a saved NetEase address when no QQ or network settings exist", () => {
  const storage = memoryStorage({ [LEGACY_WEB_SETTINGS_KEYS.backend]: neteaseAddress });

  migrateLegacyRequestSettings(storage);

  expect(migrated(storage)).toEqual({ backend: { netease: neteaseAddress } });
});

test("leaves settings already in the new shape untouched", () => {
  const current = { backend: { netease: neteaseAddress }, network: { timeout: 8000 } };
  const storage = memoryStorage({
    [WEB_REQUEST_SETTINGS_KEY]: current,
    [LEGACY_WEB_SETTINGS_KEYS.backend]: { host: "stale.example.com", port: 1, protocol: "http" },
  });

  migrateLegacyRequestSettings(storage);

  expect(migrated(storage)).toEqual(current);
  expect(storage.getItem(LEGACY_WEB_SETTINGS_KEYS.backend)).not.toBeNull();
});

test("does nothing without legacy settings and skips malformed ones", () => {
  const empty = memoryStorage();
  migrateLegacyRequestSettings(empty);
  expect(empty.values.size).toBe(0);

  const malformed = memoryStorage({
    [LEGACY_WEB_SETTINGS_KEYS.backend]: neteaseAddress,
    [LEGACY_WEB_SETTINGS_KEYS.qqBackend]: "{not json",
  });
  migrateLegacyRequestSettings(malformed);
  expect(migrated(malformed)).toEqual({ backend: { netease: neteaseAddress } });
});

test("keeps the legacy keys when the new value cannot be written", () => {
  const storage = memoryStorage({ [LEGACY_WEB_SETTINGS_KEYS.backend]: neteaseAddress });
  const failing = {
    ...storage,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };

  expect(() => migrateLegacyRequestSettings(failing)).toThrow();
  expect(storage.getItem(LEGACY_WEB_SETTINGS_KEYS.backend)).not.toBeNull();
});

test("reads a legacy app-config-updated payload in the per-platform shape", () => {
  const config = webConfigSchema.parse({
    app: { locale: "en-US" },
    backend: neteaseAddress,
    qqBackend: qqAddress,
    network: { timeout: 5000, randomCNIP: "true" },
  });

  expect(config).toEqual({
    app: { locale: "en-US" },
    backend: { netease: neteaseAddress, qq: qqAddress },
    network: { timeout: 5000 },
    netease: { randomCNIP: "true" },
  });
});
