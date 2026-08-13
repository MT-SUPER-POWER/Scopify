import { createHash } from "node:crypto";
import fs from "node:fs";
import { basename, join, parse, resolve } from "node:path";
import { homedir } from "node:os";
import type {
  CacheCategory,
  CacheCategoryStats,
  CacheScope,
  ClearDesktopCacheRequest,
  DesktopCacheStats,
  DesktopHostConfig,
  PageCacheCategory,
} from "@scopifymusicplayer/desktop-contract";

const CACHE_MARKER = ".scopify-cache-root";
const SCOPES: CacheScope[] = ["page", "playback"];

export interface PageCacheStats {
  dir: string;
  entryCount: number;
  sizeBytes: number;
}

interface CacheEntry<T> {
  category: CacheCategory;
  createdAt: number;
  expiresAt: number;
  key: string;
  value: T;
}

interface LegacyPageCacheEntry {
  createdAt: number;
  expiresAt: number;
  key: string;
}

interface PageCacheStoreOptions {
  config: DesktopHostConfig["cache"];
  defaultDir: string;
  now?: () => number;
}

export interface PageCacheStore {
  clear(request?: ClearDesktopCacheRequest): DesktopCacheStats;
  delete(key: string): void;
  deleteScoped(scope: CacheScope, key: string): void;
  get<T = unknown>(key: string): T | null;
  getScoped<T = unknown>(scope: CacheScope, key: string): T | null;
  getStats(): PageCacheStats;
  getStatsAll(): DesktopCacheStats;
  set<T = unknown>(key: string, value: T, ttlMs: number): void;
  setScoped<T = unknown>(
    scope: CacheScope,
    key: string,
    value: T,
    ttlMs: number,
    category?: CacheCategory,
  ): void;
}

function resolveCacheRoot(config: DesktopHostConfig["cache"], defaultDir: string) {
  return config.dir.trim() || defaultDir;
}

function categoryFor(scope: CacheScope, key: string, category?: CacheCategory): CacheCategory {
  if (category) return category;
  if (scope === "page") return (key.split(":", 1)[0] || "other") as PageCacheCategory;
  return "other";
}

function fileNameForKey(key: string) {
  return `${createHash("sha256").update(key).digest("hex")}.json`;
}

function scopeDir(rootDir: string, scope: CacheScope) {
  return join(rootDir, scope);
}

function ensureOwnedRoot(rootDir: string) {
  assertSafeCacheRoot(rootDir);
  fs.mkdirSync(rootDir, { recursive: true });
  const marker = join(rootDir, CACHE_MARKER);
  if (!fs.existsSync(marker)) fs.writeFileSync(marker, "Scopify cache root\n", "utf8");
}

function isOwnedRoot(rootDir: string) {
  return fs.existsSync(join(rootDir, CACHE_MARKER));
}

function isUnsafeRoot(rootDir: string) {
  const normalized = resolve(rootDir);
  return normalized === parse(normalized).root || normalized === resolve(homedir());
}

/** Blocks cache writes into broad directories that must never be app-owned. */
export function assertSafeCacheRoot(rootDir: string) {
  if (isUnsafeRoot(rootDir)) {
    throw new Error("The cache directory cannot be a filesystem root or home directory.");
  }
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function getJsonFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(dir, entry.name));
}

function getFileSize(filePath: string) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function isLegacyPageCacheFile(filePath: string) {
  const entry = safeReadJson<LegacyPageCacheEntry>(filePath);
  if (!entry) return false;
  return (
    typeof entry.key === "string" &&
    entry.key.length > 0 &&
    Number.isFinite(entry.createdAt) &&
    Number.isFinite(entry.expiresAt) &&
    entry.expiresAt >= entry.createdAt &&
    basename(filePath) === fileNameForKey(entry.key)
  );
}

/**
 * Version-one page cache wrote records straight into either the cache root or
 * its `music-pages` directory. Only move files that prove they use that exact
 * record format and hashed filename; unrelated JSON is always left in place.
 */
function migrateLegacyPageEntries(rootDir: string) {
  const pageDir = scopeDir(rootDir, "page");
  if (fs.existsSync(pageDir) && !isOwnedRoot(rootDir)) return;
  const sourceDirs = [rootDir, join(rootDir, "music-pages")];
  let migrated = false;

  for (const sourceDir of sourceDirs) {
    for (const sourceFile of getJsonFiles(sourceDir)) {
      if (!isLegacyPageCacheFile(sourceFile)) continue;
      const destinationFile = join(pageDir, basename(sourceFile));
      if (fs.existsSync(destinationFile)) continue;

      fs.mkdirSync(pageDir, { recursive: true });
      fs.copyFileSync(sourceFile, destinationFile, fs.constants.COPYFILE_EXCL);
      if (!fs.readFileSync(sourceFile).equals(fs.readFileSync(destinationFile))) {
        fs.rmSync(destinationFile, { force: true });
        throw new Error("Cannot verify migrated legacy page cache entry.");
      }
      fs.rmSync(sourceFile, { force: true });
      migrated = true;
    }
  }

  if (migrated) ensureOwnedRoot(rootDir);
}

function isCategoryForScope(scope: CacheScope, category: CacheCategory) {
  const pageCategories = new Set<CacheCategory>([
    "album",
    "artist",
    "daily",
    "playlist",
    "search",
    "other",
  ]);
  return scope === "page"
    ? pageCategories.has(category)
    : !pageCategories.has(category) || category === "other";
}

export function createPageCacheStore({
  config,
  defaultDir,
  now = () => Date.now(),
}: PageCacheStoreOptions): PageCacheStore {
  const rootDir = resolveCacheRoot(config, defaultDir);
  migrateLegacyPageEntries(rootDir);

  function getFilePath(scope: CacheScope, key: string) {
    return join(scopeDir(rootDir, scope), fileNameForKey(key));
  }

  function enabled(scope: CacheScope) {
    return config[scope].enabled;
  }

  function configuredTtlMs(scope: CacheScope, category: CacheCategory, requestedTtlMs: number) {
    if (scope === "page") {
      const configuredMinutes =
        category === "search" ? config.page.searchTtlMinutes : config.page.ttlMinutes;
      const configuredMs = configuredMinutes * 60 * 1000;
      return category === "daily" ? Math.min(requestedTtlMs, configuredMs) : configuredMs;
    }
    if (category === "play-url") return config.playback.urlTtlMinutes * 60 * 1000;
    if (category === "online-lyric") return config.playback.lyricTtlMinutes * 60 * 1000;
    return requestedTtlMs;
  }

  function pruneExpired(scope: CacheScope) {
    for (const filePath of getJsonFiles(scopeDir(rootDir, scope))) {
      const entry = safeReadJson<CacheEntry<unknown>>(filePath);
      if (!entry || entry.expiresAt <= now()) fs.rmSync(filePath, { force: true });
    }
  }

  function pruneToSizeLimit(scope: CacheScope) {
    const dir = scopeDir(rootDir, scope);
    const maxSizeBytes = config[scope].maxSizeMB * 1024 * 1024;
    const files = getJsonFiles(dir)
      .map((filePath) => ({
        filePath,
        size: getFileSize(filePath),
        mtimeMs: fs.statSync(filePath).mtimeMs,
      }))
      .sort((a, b) => a.mtimeMs - b.mtimeMs);
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);
    for (const file of files) {
      if (totalSize <= maxSizeBytes) break;
      fs.rmSync(file.filePath, { force: true });
      totalSize -= file.size;
    }

    if (scope !== "playback") return;
    const remainingFiles = getJsonFiles(dir)
      .map((filePath) => ({ filePath, mtimeMs: fs.statSync(filePath).mtimeMs }))
      .sort((a, b) => a.mtimeMs - b.mtimeMs);
    while (remainingFiles.length > config.playback.maxEntries) {
      const oldest = remainingFiles.shift();
      if (oldest) fs.rmSync(oldest.filePath, { force: true });
    }
  }

  function scopeStats(scope: CacheScope) {
    const dir = scopeDir(rootDir, scope);
    pruneExpired(scope);
    const categories = new Map<CacheCategory, CacheCategoryStats>();
    for (const filePath of getJsonFiles(dir)) {
      const entry = safeReadJson<CacheEntry<unknown>>(filePath);
      if (!entry) continue;
      const category = isCategoryForScope(scope, entry.category) ? entry.category : "other";
      const stats = categories.get(category) ?? { category, entryCount: 0, sizeBytes: 0 };
      stats.entryCount += 1;
      stats.sizeBytes += getFileSize(filePath);
      categories.set(category, stats);
    }
    const categoryStats = [...categories.values()].sort((a, b) =>
      a.category.localeCompare(b.category),
    );
    return {
      categories: categoryStats,
      dir,
      enabled: enabled(scope),
      entryCount: categoryStats.reduce((count, item) => count + item.entryCount, 0),
      maxSizeMB: config[scope].maxSizeMB,
      scope,
      sizeBytes: categoryStats.reduce((size, item) => size + item.sizeBytes, 0),
    };
  }

  function allStats(): DesktopCacheStats {
    return { page: scopeStats("page"), playback: scopeStats("playback"), rootDir };
  }

  return {
    get<T = unknown>(key: string) {
      return this.getScoped<T>("page", key);
    },
    getScoped<T = unknown>(scope: CacheScope, key: string): T | null {
      if (!enabled(scope)) return null;
      const filePath = getFilePath(scope, key);
      const entry = safeReadJson<CacheEntry<T>>(filePath);
      if (!entry || entry.key !== key) return null;
      if (entry.expiresAt <= now()) {
        fs.rmSync(filePath, { force: true });
        return null;
      }
      return entry.value;
    },
    set<T = unknown>(key: string, value: T, ttlMs: number) {
      this.setScoped("page", key, value, ttlMs);
    },
    setScoped<T = unknown>(
      scope: CacheScope,
      key: string,
      value: T,
      ttlMs: number,
      category?: CacheCategory,
    ) {
      if (!enabled(scope)) return;
      ensureOwnedRoot(rootDir);
      const dir = scopeDir(rootDir, scope);
      fs.mkdirSync(dir, { recursive: true });
      pruneExpired(scope);
      const resolvedCategory = categoryFor(scope, key, category);
      const effectiveTtlMs = configuredTtlMs(scope, resolvedCategory, ttlMs);
      fs.writeFileSync(
        getFilePath(scope, key),
        JSON.stringify({
          category: resolvedCategory,
          createdAt: now(),
          expiresAt: now() + effectiveTtlMs,
          key,
          value,
        } satisfies CacheEntry<T>),
        "utf8",
      );
      pruneToSizeLimit(scope);
    },
    delete(key: string) {
      this.deleteScoped("page", key);
    },
    deleteScoped(scope: CacheScope, key: string) {
      fs.rmSync(getFilePath(scope, key), { force: true });
    },
    clear(request?: ClearDesktopCacheRequest) {
      const scope = request?.scope ?? "page";
      const categories = request?.categories;
      const dir = scopeDir(rootDir, scope);
      if (!isOwnedRoot(rootDir)) return allStats();
      if (!categories) {
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
      } else {
        for (const filePath of getJsonFiles(dir)) {
          const entry = safeReadJson<CacheEntry<unknown>>(filePath);
          const category =
            entry && isCategoryForScope(scope, entry.category) ? entry.category : "other";
          if (entry && categories.includes(category)) fs.rmSync(filePath, { force: true });
        }
      }
      return allStats();
    },
    getStats() {
      const stats = scopeStats("page");
      return { dir: stats.dir, entryCount: stats.entryCount, sizeBytes: stats.sizeBytes };
    },
    getStatsAll: allStats,
  };
}

export function migrateCacheRoot({ from, to }: { from: string; to: string }) {
  const fromRoot = resolve(from);
  const toRoot = resolve(to);
  assertSafeCacheRoot(toRoot);
  if (fromRoot === toRoot) return;

  migrateLegacyPageEntries(fromRoot);

  const copiedScopes: CacheScope[] = [];
  try {
    fs.mkdirSync(toRoot, { recursive: true });
    for (const scope of SCOPES) {
      const sourceDir = scopeDir(fromRoot, scope);
      const targetDir = scopeDir(toRoot, scope);
      if (!fs.existsSync(sourceDir)) continue;
      if (fs.existsSync(targetDir)) {
        throw new Error(`Cannot migrate cache: target ${scope} cache already exists.`);
      }
      fs.cpSync(sourceDir, targetDir, { errorOnExist: true, force: false, recursive: true });
      if (!sameDirectoryContents(sourceDir, targetDir)) {
        throw new Error(`Cannot verify migrated ${scope} cache.`);
      }
      copiedScopes.push(scope);
    }
    ensureOwnedRoot(toRoot);

    // A cache root selected by the user is never recursively removed. Only a
    // Scopify-owned old root may lose its known cache subdirectories.
    if (isOwnedRoot(fromRoot)) {
      for (const scope of copiedScopes) {
        fs.rmSync(scopeDir(fromRoot, scope), { force: true, recursive: true });
      }
    }
  } catch (error) {
    for (const scope of copiedScopes) {
      fs.rmSync(scopeDir(toRoot, scope), { force: true, recursive: true });
    }
    throw error;
  }
}

function sameDirectoryContents(source: string | string[], target: string | string[]) {
  const sourceFiles = (Array.isArray(source) ? source : getJsonFiles(source)).sort();
  const targetFiles = (Array.isArray(target) ? target : getJsonFiles(target)).sort();
  if (sourceFiles.length !== targetFiles.length) return false;
  return sourceFiles.every((sourceFile, index) => {
    const targetFile = targetFiles[index];
    return (
      Boolean(targetFile) &&
      getFileSize(sourceFile) === getFileSize(targetFile) &&
      fs.readFileSync(sourceFile).equals(fs.readFileSync(targetFile))
    );
  });
}
