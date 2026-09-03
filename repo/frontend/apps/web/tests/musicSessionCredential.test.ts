import { expect, test } from "bun:test";

import { migrateLegacyMusicSession } from "@/lib/web/musicSessionCredential";
import type { MusicSessionMigrationEnvironment } from "@/types/musicSession";

test("promotes one legacy credential through login refresh without putting it in the URL", async () => {
  const values = new Map<string, string>([["music_cookie", "MUSIC_U=legacy; __csrf=token"]]);
  const requests: Array<{ body: unknown; credentials: unknown; url: string }> = [];
  const environment: MusicSessionMigrationEnvironment = {
    fetch: async (input, init) => {
      requests.push({ body: init.body, credentials: init.credentials, url: input.toString() });
      return { json: async () => ({ code: 200 }), ok: true };
    },
    storage: {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
    },
  };

  await expect(
    migrateLegacyMusicSession("https://backend.example", 5_000, environment),
  ).resolves.toBeTrue();

  expect(requests).toEqual([
    {
      body: JSON.stringify({ cookie: "MUSIC_U=legacy; __csrf=token" }),
      credentials: "include",
      url: "https://backend.example/login/refresh",
    },
  ]);
  expect(values.has("music_cookie")).toBeFalse();
});
