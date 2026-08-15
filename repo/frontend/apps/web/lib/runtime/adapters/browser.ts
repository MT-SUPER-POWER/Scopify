import {
  DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES,
  type CacheCategory,
  type CacheScope,
  type DesktopCacheStats,
  type DesktopIconVisibilityState,
  type DesktopPlaybackWallpaperModel,
  type PageCacheStats,
} from "@scopify/desktop-contract";

import {
  createBrowserCacheStorage,
  createLegacyBrowserPlaybackStorage,
  type BrowserCacheRecord,
  type BrowserCacheStorage,
  type LegacyBrowserPlaybackStorage,
} from "@/lib/cache/browserCacheStorage";
import type { CachePreferences } from "@/types/cache";
import type { AppUpdateState } from "@/types/updater";

import type { WebRuntime } from "../types";

const WEB_CACHE_KEY = "scopify-page-cache-store";
const OLD_WEB_CACHE_PREFIX = "scopify-page-cache:";
const WEB_CACHE_PREFERENCES_KEY = "scopify-cache-preferences-v1";
const LEGACY_PLAYBACK_MIGRATION_KEY = "scopify-playback-cache-migration-v2";
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const NOOP = () => undefined;

const DEFAULT_CACHE_PREFERENCES: CachePreferences = {
  page: { enabled: true, maxSizeMB: 256, searchTtlMinutes: 30, ttlMinutes: 360 },
  playback: {
    enabled: true,
    lyricTtlMinutes: 1440,
    maxEntries: 100,
    maxSizeMB: 64,
    urlTtlMinutes: 30,
  },
};

const PAGE_CATEGORIES = new Set<CacheCategory>([
  "album",
  "artist",
  "daily",
  "playlist",
  "search",
  "other",
]);
const PLAYBACK_CATEGORIES = new Set<CacheCategory>([
  "play-url",
  "online-lyric",
  "lyric-match",
  "imported-lyric",
  "lyric-source",
  "other",
]);

export interface BrowserRuntimeEnvironment {
  readonly document?: {
    cookie: string;
    readonly documentElement: { requestFullscreen?(): Promise<void> };
    exitFullscreen?(): Promise<void>;
    readonly fullscreenElement: Element | null;
    addEventListener(type: "fullscreenchange", callback: () => void): void;
    removeEventListener(type: "fullscreenchange", callback: () => void): void;
  };
  readonly cacheStorage?: BrowserCacheStorage;
  readonly legacyPlaybackStorage?: LegacyBrowserPlaybackStorage;
  readonly storage?: Pick<Storage, "getItem" | "key" | "length" | "removeItem" | "setItem">;
}

function unsupportedUpdateState(): AppUpdateState {
  return { currentVersion: "", status: "unsupported", supported: false };
}

function unsupportedDesktopPlaybackWallpaperModel(): DesktopPlaybackWallpaperModel {
  return {
    preferences: {
      ...DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES,
      layers: { ...DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.layers },
    },
    status: {
      diagnostic: "Desktop playback wallpaper requires the Windows desktop runtime.",
      state: "unsupported",
    },
  };
}

function unsupportedDesktopIconVisibilityState(): DesktopIconVisibilityState {
  return {
    diagnostic: "Desktop icon visibility control requires Windows Explorer.",
    supported: false,
    visible: null,
  };
}

function getDefaultEnvironment(): BrowserRuntimeEnvironment {
  return {
    document: typeof document === "undefined" ? undefined : document,
    storage: typeof localStorage === "undefined" ? undefined : localStorage,
  };
}

export function createBrowserRuntime(
  environment: BrowserRuntimeEnvironment = getDefaultEnvironment(),
): WebRuntime {
  const cacheStorage = environment.cacheStorage ?? createBrowserCacheStorage();
  const legacyPlaybackStorage =
    environment.legacyPlaybackStorage ?? createLegacyBrowserPlaybackStorage();
  let cleanedLegacyPageCache = false;
  let playbackMigration: Promise<void> | null = null;

  const removeLegacyPageCache = () => {
    if (cleanedLegacyPageCache) return;
    cleanedLegacyPageCache = true;
    const storage = environment.storage;
    if (!storage) return;

    try {
      const oldKeys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(OLD_WEB_CACHE_PREFIX)) oldKeys.push(key);
      }
      oldKeys.forEach((key) => storage.removeItem(key));
      // The old monolithic localStorage cache cannot be classified reliably.
      // It only holds refetchable query data, so dropping it is the safe migration.
      storage.removeItem(WEB_CACHE_KEY);
    } catch {
      // Browser storage is optional in private and embedded contexts.
    }
  };

  const readPreferences = (): CachePreferences => {
    const storage = environment.storage;
    if (!storage) return structuredClone(DEFAULT_CACHE_PREFERENCES);

    try {
      const raw = storage.getItem(WEB_CACHE_PREFERENCES_KEY);
      return raw
        ? normalizePreferences(JSON.parse(raw))
        : structuredClone(DEFAULT_CACHE_PREFERENCES);
    } catch {
      return structuredClone(DEFAULT_CACHE_PREFERENCES);
    }
  };

  const savePreferences = (preferences: CachePreferences): CachePreferences => {
    const normalized = normalizePreferences(preferences);
    try {
      environment.storage?.setItem(WEB_CACHE_PREFERENCES_KEY, JSON.stringify(normalized));
    } catch {
      // Preference persistence is best effort for browsers that reject localStorage.
    }
    return normalized;
  };

  const migrateLegacyPlaybackCache = async () => {
    if (environment.storage?.getItem(LEGACY_PLAYBACK_MIGRATION_KEY) === "complete") return;

    try {
      const legacyEntries = await legacyPlaybackStorage.entries();
      const playbackEntries = legacyEntries.filter(([key]) => isLegacyPlaybackKey(key));
      const preferences = readPreferences();

      for (const [key, value] of playbackEntries) {
        const records = legacyPlaybackRecords(key, value, preferences, Date.now());
        for (const record of records) {
          const existing = await cacheStorage.get("playback", record.key);
          if (!existing) await cacheStorage.set("playback", record.key, record.value);
        }
        // New data has been durably placed (or was already present), so this old
        // source can be removed without risking loss of user-managed lyric data.
        await legacyPlaybackStorage.delete(key);
      }

      environment.storage?.setItem(LEGACY_PLAYBACK_MIGRATION_KEY, "complete");
    } catch {
      // Do not set the marker. A later cache operation retries incomplete migration.
    }
  };

  const ensurePlaybackMigration = () => {
    playbackMigration ??= migrateLegacyPlaybackCache();
    return playbackMigration;
  };

  const getScoped = async <T>(scope: CacheScope, key: string): Promise<T | null> => {
    removeLegacyPageCache();
    if (scope === "playback") await ensurePlaybackMigration();
    try {
      const record = await cacheStorage.get(scope, key);
      if (!record) return null;
      if (record.expiresAt <= Date.now()) {
        await cacheStorage.delete(scope, key);
        return null;
      }
      await cacheStorage.set(scope, key, { ...record, accessedAt: Date.now() });
      return record.value as T;
    } catch {
      return null;
    }
  };

  const deleteScoped = async (scope: CacheScope, key: string) => {
    removeLegacyPageCache();
    if (scope === "playback") await ensurePlaybackMigration();
    try {
      const records = await cacheStorage.entries(scope);
      await Promise.all(
        records
          .filter(([storedKey]) => storedKey === key || storedKey.startsWith(`${key}:`))
          .map(([storedKey]) => cacheStorage.delete(scope, storedKey)),
      );
    } catch {
      // Caches are an optimization; deletion must never break user actions.
    }
  };

  const pruneScope = async (scope: CacheScope, preferences = readPreferences()) => {
    const scopePreferences = preferences[scope];
    const now = Date.now();
    const records = await cacheStorage.entries(scope);
    const active = records.filter(([, record]) => record.expiresAt > now);
    await Promise.all(
      records
        .filter(([, record]) => record.expiresAt <= now)
        .map(([key]) => cacheStorage.delete(scope, key)),
    );

    const candidates = [...active].sort(
      ([, left], [, right]) => left.accessedAt - right.accessedAt,
    );
    const maximumEntries =
      scope === "playback" ? preferences.playback.maxEntries : Number.POSITIVE_INFINITY;
    let totalBytes = candidates.reduce((total, [, record]) => total + record.sizeBytes, 0);
    const maximumBytes = scopePreferences.maxSizeMB * 1024 * 1024;

    while (candidates.length > maximumEntries || totalBytes > maximumBytes) {
      const oldest = candidates.shift();
      if (!oldest) break;
      totalBytes -= oldest[1].sizeBytes;
      await cacheStorage.delete(scope, oldest[0]);
    }
  };

  const scopedStats = async (scope: CacheScope, preferences = readPreferences()) => {
    if (scope === "playback") await ensurePlaybackMigration();
    await pruneScope(scope, preferences);
    const records = await cacheStorage.entries(scope);
    const categories = categoriesForScope(scope).map((category) => {
      const categoryRecords = records.filter(([, record]) => record.category === category);
      return {
        category,
        entryCount: categoryRecords.length,
        sizeBytes: categoryRecords.reduce((total, [, record]) => total + record.sizeBytes, 0),
      };
    });
    return {
      categories,
      dir: "IndexedDB (scopify-cache)",
      enabled: preferences[scope].enabled,
      entryCount: categories.reduce((total, category) => total + category.entryCount, 0),
      maxSizeMB: preferences[scope].maxSizeMB,
      scope,
      sizeBytes: categories.reduce((total, category) => total + category.sizeBytes, 0),
    };
  };

  const statsAll = async (): Promise<DesktopCacheStats> => {
    removeLegacyPageCache();
    const preferences = readPreferences();
    try {
      const [page, playback] = await Promise.all([
        scopedStats("page", preferences),
        scopedStats("playback", preferences),
      ]);
      return { page, playback, rootDir: "IndexedDB (scopify-cache)" };
    } catch {
      return emptyStats(preferences);
    }
  };

  const pageStats = async (): Promise<PageCacheStats> => {
    const page = (await statsAll()).page;
    return { dir: page.dir, entryCount: page.entryCount, sizeBytes: page.sizeBytes };
  };

  const setScoped = async <T>(
    scope: CacheScope,
    key: string,
    value: T,
    ttlMs: number,
    category?: CacheCategory,
  ) => {
    removeLegacyPageCache();
    if (scope === "playback") await ensurePlaybackMigration();
    const preferences = readPreferences();
    if (!preferences[scope].enabled) return;
    try {
      const resolvedCategory = categoryForKey(scope, key, category);
      const now = Date.now();
      const record: BrowserCacheRecord = {
        accessedAt: now,
        category: resolvedCategory,
        expiresAt: now + Math.max(ttlMs, 0),
        sizeBytes: logicalSizeBytes(key, value),
        value,
      };
      await cacheStorage.set(scope, key, record);
      await pruneScope(scope, preferences);
    } catch {
      // IndexedDB quota/privacy errors do not affect normal playback or navigation.
    }
  };

  return {
    app: {
      exit: NOOP,
      relaunch: NOOP,
      submitCloseAction: NOOP,
    },
    audioFeature: {
      connect: () => NOOP,
      publish: () => false,
    },
    auth: {
      completeLogin: () => false,
      openLoginWindow: () => false,
      persistMusicCookie: async (cookie) => {
        if (!environment.document) return false;
        const musicUMatch = /MUSIC_U=([^;]+)/.exec(cookie);
        environment.document.cookie = `MUSIC_U=${musicUMatch?.[1] ?? ""}; path=/; max-age=${60 * 60 * 24 * 30}`;
        return true;
      },
    },
    cache: {
      clear: async () => {
        await cacheStorage.clear("page");
        return pageStats();
      },
      clearSelected: async (request) => {
        if (request.scope === "playback") await ensurePlaybackMigration();
        const records = await cacheStorage.entries(request.scope);
        const categories = new Set(request.categories);
        await Promise.all(
          records
            .filter(([, record]) => categories.has(record.category as CacheCategory))
            .map(([key]) => cacheStorage.delete(request.scope, key)),
        );
        return statsAll();
      },
      delete: (key) => deleteScoped("page", key),
      deleteScoped,
      get: <T>(key: string) => getScoped<T>("page", key),
      getPreferences: async () => readPreferences(),
      getScoped,
      savePreferences: async (preferences) => savePreferences(preferences),
      set: (key, value, ttlMs) => setScoped("page", key, value, ttlMs),
      setScoped,
      stats: pageStats,
      statsAll,
    },
    config: {
      loadHostConfig: async () => null,
      saveHostConfig: async () => null,
      selectDirectory: async () => null,
    },
    desktopIcons: {
      getVisibility: async () => unsupportedDesktopIconVisibilityState(),
      setVisibility: async () => unsupportedDesktopIconVisibilityState(),
    },
    discord: {
      getStatus: async () => null,
      onStatusChanged: () => NOOP,
      publish: async () => null,
      testConnection: async () => null,
    },
    desktopLyrics: {
      close: async () => false,
      getPreferences: async () => null,
      onCommand: () => NOOP,
      open: async () => false,
      sendCommand: NOOP,
      toggle: async () => false,
      updatePreferences: async () => null,
    },
    desktopPlaybackWallpaper: {
      closeController: async () => false,
      configure: async () => unsupportedDesktopPlaybackWallpaperModel(),
      getModel: async () => unsupportedDesktopPlaybackWallpaperModel(),
      onModelChanged: () => NOOP,
      retry: async () => unsupportedDesktopPlaybackWallpaperModel(),
      setControllerLayout: async () => false,
      showController: async () => ({ opened: false, reason: "unsupported" }),
    },
    isDesktop: false,
    kind: "browser",
    logging: {
      getDirectory: async () => null,
      write: async () => false,
    },
    media: {
      onCommand: () => NOOP,
      setPlaying: NOOP,
    },
    navigation: {
      navigateMainWindow: () => false,
      onNavigate: () => NOOP,
    },
    playback: {
      connect: () => NOOP,
      send: () => false,
    },
    updates: {
      check: async () => unsupportedUpdateState(),
      download: async () => unsupportedUpdateState(),
      getStatus: async () => unsupportedUpdateState(),
      install: NOOP,
      onStatusChanged: () => NOOP,
    },
    window: {
      minimize: NOOP,
      onFullscreenChanged: (callback) => {
        const doc = environment.document;
        if (!doc) return NOOP;
        const onChange = () => callback(Boolean(doc.fullscreenElement));
        doc.addEventListener("fullscreenchange", onChange);
        return () => doc.removeEventListener("fullscreenchange", onChange);
      },
      setFullscreen: async (fullscreen) => {
        const doc = environment.document;
        if (!doc) return;
        if (fullscreen) await doc.documentElement.requestFullscreen?.();
        else if (doc.fullscreenElement) await doc.exitFullscreen?.();
      },
    },
  };
}

function categoriesForScope(scope: CacheScope): CacheCategory[] {
  return [...(scope === "page" ? PAGE_CATEGORIES : PLAYBACK_CATEGORIES)];
}

function categoryForKey(scope: CacheScope, key: string, category?: CacheCategory): CacheCategory {
  const permittedCategories = scope === "page" ? PAGE_CATEGORIES : PLAYBACK_CATEGORIES;
  if (category && permittedCategories.has(category)) return category;

  const namespace = key.split(":", 1)[0];
  if (scope === "page" && PAGE_CATEGORIES.has(namespace as CacheCategory)) {
    return namespace as CacheCategory;
  }
  return "other";
}

function logicalSizeBytes(key: string, value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify({ key, value })).byteLength;
  } catch {
    return new TextEncoder().encode(key).byteLength;
  }
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : fallback;
}

function normalizePreferences(input: unknown): CachePreferences {
  const candidate = input as Partial<CachePreferences> | null;
  const page = candidate?.page;
  const playback = candidate?.playback;
  return {
    page: {
      enabled: page?.enabled !== false,
      maxSizeMB: normalizePositiveInteger(
        page?.maxSizeMB,
        DEFAULT_CACHE_PREFERENCES.page.maxSizeMB,
      ),
      searchTtlMinutes: normalizePositiveInteger(
        page?.searchTtlMinutes,
        DEFAULT_CACHE_PREFERENCES.page.searchTtlMinutes,
      ),
      ttlMinutes: normalizePositiveInteger(
        page?.ttlMinutes,
        DEFAULT_CACHE_PREFERENCES.page.ttlMinutes,
      ),
    },
    playback: {
      enabled: playback?.enabled !== false,
      lyricTtlMinutes: normalizePositiveInteger(
        playback?.lyricTtlMinutes,
        DEFAULT_CACHE_PREFERENCES.playback.lyricTtlMinutes,
      ),
      maxEntries: normalizePositiveInteger(
        playback?.maxEntries,
        DEFAULT_CACHE_PREFERENCES.playback.maxEntries,
      ),
      maxSizeMB: normalizePositiveInteger(
        playback?.maxSizeMB,
        DEFAULT_CACHE_PREFERENCES.playback.maxSizeMB,
      ),
      urlTtlMinutes: normalizePositiveInteger(
        playback?.urlTtlMinutes,
        DEFAULT_CACHE_PREFERENCES.playback.urlTtlMinutes,
      ),
    },
  };
}

function emptyStats(preferences: CachePreferences): DesktopCacheStats {
  const scope = (name: CacheScope) => ({
    categories: categoriesForScope(name).map((category) => ({
      category,
      entryCount: 0,
      sizeBytes: 0,
    })),
    dir: "IndexedDB (scopify-cache)",
    enabled: preferences[name].enabled,
    entryCount: 0,
    maxSizeMB: preferences[name].maxSizeMB,
    scope: name,
    sizeBytes: 0,
  });
  return { page: scope("page"), playback: scope("playback"), rootDir: "IndexedDB (scopify-cache)" };
}

interface LegacyPlaybackSongEntry {
  cachedAt?: unknown;
  lyric?: unknown;
  lyricCachedAt?: unknown;
  url?: unknown;
  urlCachedAt?: unknown;
}

interface LegacyPlaybackMigrationRecord {
  key: string;
  value: BrowserCacheRecord;
}

function isLegacyPlaybackKey(key: string): boolean {
  return (
    key.startsWith("playback-song:") ||
    key.startsWith("playback-lyric-override:") ||
    key.startsWith("playback-imported-lyric:") ||
    key.startsWith("playback-lyric-source:")
  );
}

function legacyPlaybackRecords(
  key: string,
  value: unknown,
  preferences: CachePreferences,
  now: number,
): LegacyPlaybackMigrationRecord[] {
  if (key.startsWith("playback-lyric-override:")) {
    return [legacyRecord(key, value, "lyric-match", now, now + TEN_YEARS_MS)];
  }
  if (key.startsWith("playback-imported-lyric:")) {
    return [legacyRecord(key, value, "imported-lyric", now, now + TEN_YEARS_MS)];
  }
  if (key.startsWith("playback-lyric-source:")) {
    return [legacyRecord(key, value, "lyric-source", now, now + TEN_YEARS_MS)];
  }

  const songId = key.slice("playback-song:".length);
  if (!songId || !isRecord(value)) return [];
  const entry = value as LegacyPlaybackSongEntry;
  const records: LegacyPlaybackMigrationRecord[] = [];
  const urlTtlMs = preferences.playback.urlTtlMinutes * 60 * 1000;
  const lyricTtlMs = preferences.playback.lyricTtlMinutes * 60 * 1000;
  const urlCachedAt = isRecord(entry.urlCachedAt) ? entry.urlCachedAt : {};

  if (isRecord(entry.url)) {
    for (const [quality, url] of Object.entries(entry.url)) {
      if (typeof url !== "string" || !url) continue;
      const cachedAt = timestampOrFallback(urlCachedAt[quality], entry.cachedAt, now);
      if (cachedAt + urlTtlMs <= now) continue;
      records.push(
        legacyRecord(
          `playback-play-url:${songId}:${quality}`,
          url,
          "play-url",
          cachedAt,
          cachedAt + urlTtlMs,
        ),
      );
    }
  }

  if (entry.lyric != null) {
    const cachedAt = timestampOrFallback(entry.lyricCachedAt, entry.cachedAt, now);
    if (cachedAt + lyricTtlMs > now) {
      records.push(
        legacyRecord(
          `playback-online-lyric:${songId}`,
          entry.lyric,
          "online-lyric",
          cachedAt,
          cachedAt + lyricTtlMs,
        ),
      );
    }
  }

  return records;
}

function legacyRecord(
  key: string,
  value: unknown,
  category: CacheCategory,
  accessedAt: number,
  expiresAt: number,
): LegacyPlaybackMigrationRecord {
  return {
    key,
    value: {
      accessedAt,
      category,
      expiresAt,
      sizeBytes: logicalSizeBytes(key, value),
      value,
    },
  };
}

function timestampOrFallback(primary: unknown, fallback: unknown, now: number): number {
  const timestamp =
    typeof primary === "number" ? primary : typeof fallback === "number" ? fallback : now;
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : now;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
