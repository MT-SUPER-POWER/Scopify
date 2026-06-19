import { createHash } from "node:crypto";
import fs from "node:fs";
import { join } from "node:path";
import type { AppConfig } from "../../types/config.js";

export interface PageCacheStats {
  dir: string;
  entryCount: number;
  sizeBytes: number;
}

interface CacheEntry<T> {
  key: string;
  createdAt: number;
  expiresAt: number;
  value: T;
}

interface PageCacheStoreOptions {
  config: AppConfig["cache"];
  defaultDir: string;
  now?: () => number;
}

export interface PageCacheStore {
  get<T = unknown>(key: string): T | null;
  set<T = unknown>(key: string, value: T, ttlMs: number): void;
  delete(key: string): void;
  clear(): void;
  getStats(): PageCacheStats;
}

function resolveCacheDir(config: AppConfig["cache"], defaultDir: string) {
  return config.dir.trim() || defaultDir;
}

function fileNameForKey(key: string) {
  return `${createHash("sha256").update(key).digest("hex")}.json`;
}

function ensureCacheDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
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

function pruneToSizeLimit(dir: string, maxSizeBytes: number) {
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
}

export function createPageCacheStore({
  config,
  defaultDir,
  now = () => Date.now(),
}: PageCacheStoreOptions): PageCacheStore {
  const dir = resolveCacheDir(config, defaultDir);
  const maxSizeBytes = config.maxSizeMB * 1024 * 1024;

  function getFilePath(key: string) {
    return join(dir, fileNameForKey(key));
  }

  return {
    get<T = unknown>(key: string): T | null {
      if (!config.enabled) return null;

      const filePath = getFilePath(key);
      const entry = safeReadJson<CacheEntry<T>>(filePath);
      if (!entry || entry.key !== key) return null;

      if (entry.expiresAt <= now()) {
        fs.rmSync(filePath, { force: true });
        return null;
      }

      return entry.value;
    },

    set<T = unknown>(key: string, value: T, ttlMs: number) {
      if (!config.enabled) return;

      ensureCacheDir(dir);
      const entry: CacheEntry<T> = {
        key,
        createdAt: now(),
        expiresAt: now() + ttlMs,
        value,
      };
      fs.writeFileSync(getFilePath(key), JSON.stringify(entry), "utf-8");
      pruneToSizeLimit(dir, maxSizeBytes);
    },

    delete(key: string) {
      if (!config.enabled) return;
      fs.rmSync(getFilePath(key), { force: true });
    },

    clear() {
      if (!fs.existsSync(dir)) return;
      fs.rmSync(dir, { recursive: true, force: true });
      ensureCacheDir(dir);
    },

    getStats(): PageCacheStats {
      if (!config.enabled) {
        return { dir, entryCount: 0, sizeBytes: 0 };
      }

      const files = getJsonFiles(dir);
      return {
        dir,
        entryCount: files.length,
        sizeBytes: files.reduce((sum, filePath) => sum + getFileSize(filePath), 0),
      };
    },
  };
}
