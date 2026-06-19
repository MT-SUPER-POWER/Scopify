import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPageCacheStore } from "@/main/module/pageCache";
import type { AppConfig } from "@/types/config";

const tempDirs: string[] = [];

function createTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "scopify-page-cache-"));
  tempDirs.push(dir);
  return dir;
}

function createConfig(dir: string): AppConfig["cache"] {
  return {
    enabled: true,
    dir,
    maxSizeMB: 256,
    pageTtlMinutes: 360,
    searchTtlMinutes: 30,
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

test("page cache returns a fresh value written to disk", () => {
  const dir = createTempDir();
  const store = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: join(dir, "default"),
    now: () => 1_000,
  });

  store.set("playlist:42", { songs: [1, 2, 3] }, 60_000);

  expect(store.get("playlist:42")).toEqual({ songs: [1, 2, 3] });
});

test("page cache removes expired values", () => {
  const dir = createTempDir();
  let now = 1_000;
  const store = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: join(dir, "default"),
    now: () => now,
  });

  store.set("album:7", { title: "Album" }, 50);
  now = 1_051;

  expect(store.get("album:7")).toBeNull();
});

test("page cache clear removes all entries and reports size", () => {
  const dir = createTempDir();
  const store = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: join(dir, "default"),
    now: () => 1_000,
  });

  store.set("artist:1", { name: "A" }, 60_000);
  expect(store.getStats().entryCount).toBe(1);
  expect(store.getStats().sizeBytes).toBeGreaterThan(0);

  store.clear();

  expect(store.getStats().entryCount).toBe(0);
  expect(store.get("artist:1")).toBeNull();
});

test("page cache no-ops when disabled", () => {
  const dir = createTempDir();
  const store = createPageCacheStore({
    config: { ...createConfig(dir), enabled: false },
    defaultDir: join(dir, "default"),
    now: () => 1_000,
  });

  store.set("search:test", { hits: [1] }, 60_000);

  expect(store.get("search:test")).toBeNull();
  expect(store.getStats().entryCount).toBe(0);
});
