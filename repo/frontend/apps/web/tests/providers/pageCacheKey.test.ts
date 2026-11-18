import { expect, mock, test } from "bun:test";

mock.module("@/lib/runtime", () => ({ runtime: {} }));

const { createPageCacheKey } = await import("@/lib/cache/pageCache");

test("puts the platform right after the namespace", () => {
  expect(createPageCacheKey("playlist", "qq", [123])).toBe("playlist:qq:123");
  expect(createPageCacheKey("playlist", "netease", [123])).toBe("playlist:netease:123");
});

test("keeps the namespace first and drops empty parts", () => {
  const key = createPageCacheKey("search", "qq", ["a:b", null, undefined, 2]);
  expect(key.split(":", 1)[0]).toBe("search");
  expect(key).toBe("search:qq:a%3Ab:2");
});
