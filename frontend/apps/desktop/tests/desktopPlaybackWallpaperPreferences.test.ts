import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDesktopPlaybackWallpaperPreferencesRepository } from "@/main/module/desktopPlaybackWallpaper/preferences";

const tempDirectories: string[] = [];

function createPreferencesPath() {
  const directory = mkdtempSync(join(tmpdir(), "scopify-wallpaper-preferences-"));
  tempDirectories.push(directory);
  return join(directory, "desktop-playback-wallpaper.json");
}

afterEach(() => {
  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();
    if (directory) rmSync(directory, { force: true, recursive: true });
  }
});

describe("desktop playback wallpaper preferences repository", () => {
  test("round-trips the versioned preference document", () => {
    const filePath = createPreferencesPath();
    const repository = createDesktopPlaybackWallpaperPreferencesRepository({ filePath });
    const preferences = {
      enabled: true,
      fullscreenPolicy: "stop" as const,
      layers: { background: false, lyrics: true },
      systemWallpaperFallback: false,
    };

    repository.save(preferences);

    expect(repository.load()).toEqual(preferences);
    expect(JSON.parse(readFileSync(filePath, "utf-8"))).toEqual({
      preferences,
      version: 1,
    });
  });

  test("migrates the unversioned foundation shape on read", () => {
    const filePath = createPreferencesPath();
    writeFileSync(
      filePath,
      JSON.stringify({
        enabled: true,
        layers: { background: true, lyrics: false },
      }),
      "utf-8",
    );
    const repository = createDesktopPlaybackWallpaperPreferencesRepository({ filePath });

    expect(repository.load()).toEqual({
      enabled: true,
      fullscreenPolicy: "pause",
      layers: { background: true, lyrics: false },
      systemWallpaperFallback: false,
    });
  });

  test("returns safe defaults and reports corrupt JSON", () => {
    const filePath = createPreferencesPath();
    const errors: string[] = [];
    writeFileSync(filePath, "{not-json", "utf-8");
    const repository = createDesktopPlaybackWallpaperPreferencesRepository({
      filePath,
      onError: (message) => errors.push(message),
    });

    expect(repository.load()).toEqual({
      enabled: false,
      fullscreenPolicy: "pause",
      layers: { background: true, lyrics: true },
      systemWallpaperFallback: false,
    });
    expect(errors).toEqual(["Failed to read desktop playback wallpaper preferences."]);
  });
});
