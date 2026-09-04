import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_ROOT = join(import.meta.dir, "..");
const RAW_LIKE_API_OWNER = "lib/playlist/songLikeMutation.ts";

function source(relativePath: string) {
  return readFileSync(join(WEB_ROOT, relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test("PlayBar and every song-like UI entry use the shared mutation pipeline", () => {
  const playerBar = source("components/PlayerBar.tsx");
  const authority = source("components/player/PlaybackAuthorityProvider.tsx");

  expect(playerBar).toContain("commands.toggleLike()");
  expect(authority).toContain(
    'import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation"',
  );
  expect(authority).not.toContain("toggleCurrentSongLike");

  const bypasses = ["components", "hooks", "lib"]
    .flatMap((directory) => sourceFiles(join(WEB_ROOT, directory)))
    .map((path) => ({
      path: relative(WEB_ROOT, path).replaceAll("\\", "/"),
      text: readFileSync(path, "utf8"),
    }))
    .filter(({ path, text }) => {
      if (path === "lib/api/playlist.ts" || path === RAW_LIKE_API_OWNER) return false;
      return /\blikeSong\s*\(/.test(text);
    })
    .map(({ path }) => path);

  expect(bypasses).toEqual([]);
});
