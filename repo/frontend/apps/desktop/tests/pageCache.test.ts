import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createPageCacheStore, migrateCacheRoot } from "@/main/services/pageCache";
import type { DesktopHostConfig } from "@scopify/desktop-contract";

const tempDirs: string[] = [];

function createTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "scopify-page-cache-"));
  tempDirs.push(dir);
  return dir;
}

function createConfig(dir: string): DesktopHostConfig["cache"] {
  return {
    dir,
    page: { enabled: true, maxSizeMB: 256, ttlMinutes: 360, searchTtlMinutes: 30 },
    playback: {
      enabled: true,
      maxSizeMB: 64,
      maxEntries: 100,
      urlTtlMinutes: 30,
      lyricTtlMinutes: 1440,
    },
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

  expect(store.get<{ songs: number[] }>("playlist:42")).toEqual({ songs: [1, 2, 3] });
});

test("page cache removes expired values", () => {
  const dir = createTempDir();
  let now = 1_000;
  const config = createConfig(dir);
  config.page.ttlMinutes = 1;
  const store = createPageCacheStore({
    config,
    defaultDir: join(dir, "default"),
    now: () => now,
  });

  store.set("album:7", { title: "Album" }, 60_000);
  now = 61_001;

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
    config: { ...createConfig(dir), page: { ...createConfig(dir).page, enabled: false } },
    defaultDir: join(dir, "default"),
    now: () => 1_000,
  });

  store.set("search:test", { hits: [1] }, 60_000);

  expect(store.get("search:test")).toBeNull();
  expect(store.getStats().entryCount).toBe(0);
});

test("scoped cache keeps page and playback data physically isolated", () => {
  const dir = createTempDir();
  const store = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: dir,
    now: () => 1_000,
  });

  store.setScoped("page", "search:one", { result: 1 }, 60_000, "search");
  store.setScoped(
    "playback",
    "playback-play-url:one",
    { url: "https://example.test" },
    60_000,
    "play-url",
  );

  const stats = store.getStatsAll();
  expect(stats.page.categories).toEqual([
    expect.objectContaining({ category: "search", entryCount: 1 }),
  ]);
  expect(stats.playback.categories).toEqual([
    expect.objectContaining({ category: "play-url", entryCount: 1 }),
  ]);
  expect(existsSync(join(dir, "page"))).toBe(true);
  expect(existsSync(join(dir, "playback"))).toBe(true);
});

test("selective clear removes only the requested cache category", () => {
  const dir = createTempDir();
  const store = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: dir,
    now: () => 1_000,
  });
  store.setScoped("playback", "url:one", { value: 1 }, 60_000, "play-url");
  store.setScoped("playback", "lyric:one", { value: 1 }, 60_000, "online-lyric");

  store.clear({ scope: "playback", categories: ["play-url"] });

  expect(store.getScoped("playback", "url:one")).toBeNull();
  expect(store.getScoped<{ value: number }>("playback", "lyric:one")).toEqual({ value: 1 });
});

test("stats retain existing cache size while the scope is disabled", () => {
  const dir = createTempDir();
  const enabledStore = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: dir,
    now: () => 1_000,
  });
  enabledStore.set("album:one", { value: 1 }, 60_000);
  const disabledConfig = createConfig(dir);
  disabledConfig.page.enabled = false;
  const disabledStore = createPageCacheStore({
    config: disabledConfig,
    defaultDir: dir,
    now: () => 1_000,
  });

  expect(disabledStore.getStatsAll().page.sizeBytes).toBeGreaterThan(0);
  expect(disabledStore.get("album:one")).toBeNull();
});

test("cache root migration copies both scoped directories before removing owned originals", () => {
  const from = createTempDir();
  const to = createTempDir();
  const store = createPageCacheStore({
    config: createConfig(from),
    defaultDir: from,
    now: () => 1_000,
  });
  store.setScoped("page", "playlist:one", { value: 1 }, 60_000, "playlist");
  store.setScoped("playback", "url:one", { value: 2 }, 60_000, "play-url");

  migrateCacheRoot({ from, to });

  const migrated = createPageCacheStore({
    config: createConfig(to),
    defaultDir: to,
    now: () => 1_000,
  });
  expect(migrated.getScoped<{ value: number }>("page", "playlist:one")).toEqual({ value: 1 });
  expect(migrated.getScoped<{ value: number }>("playback", "url:one")).toEqual({ value: 2 });
  expect(existsSync(join(from, "page"))).toBe(false);
  expect(existsSync(join(from, "playback"))).toBe(false);
});

test("initialization upgrades only verified flat legacy cache JSON into page storage", () => {
  const dir = createTempDir();
  const key = "playlist:legacy";
  const fileName = `${createHash("sha256").update(key).digest("hex")}.json`;
  writeFileSync(
    join(dir, fileName),
    JSON.stringify({ key, createdAt: 1_000, expiresAt: 61_000, value: { title: "Legacy" } }),
    "utf8",
  );
  writeFileSync(join(dir, "unrelated.json"), JSON.stringify({ keep: true }), "utf8");
  const legacySubdir = join(dir, "music-pages");
  mkdirSync(legacySubdir);
  writeFileSync(join(legacySubdir, "notes.json"), JSON.stringify({ keep: true }), "utf8");

  const store = createPageCacheStore({
    config: createConfig(dir),
    defaultDir: dir,
    now: () => 1_000,
  });

  expect(store.get<{ title: string }>(key)).toEqual({ title: "Legacy" });
  expect(existsSync(join(dir, "page", fileName))).toBe(true);
  expect(existsSync(join(dir, fileName))).toBe(false);
  expect(existsSync(join(dir, "unrelated.json"))).toBe(true);
  expect(existsSync(join(legacySubdir, "notes.json"))).toBe(true);
});

test("legacy migration never claims an existing unmarked page directory", () => {
  const dir = createTempDir();
  mkdirSync(join(dir, "page"));
  const key = "album:legacy";
  const fileName = `${createHash("sha256").update(key).digest("hex")}.json`;
  writeFileSync(
    join(dir, fileName),
    JSON.stringify({ key, createdAt: 1_000, expiresAt: 61_000, value: { title: "Leave" } }),
    "utf8",
  );

  createPageCacheStore({ config: createConfig(dir), defaultDir: dir, now: () => 1_000 });

  expect(existsSync(join(dir, fileName))).toBe(true);
  expect(existsSync(join(dir, ".scopify-cache-root"))).toBe(false);
});
