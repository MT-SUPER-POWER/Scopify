import { expect, test } from "bun:test";

import type { SongUrlV1Response } from "@/types/api/music";

const cookie = process.env.SCOPIFY_TEST_NETEASE_COOKIE?.trim();
const songId = process.env.SCOPIFY_TEST_VIP_SONG_ID?.trim();
const backendOrigin = process.env.SCOPIFY_TEST_BACKEND_ORIGIN?.trim() || "http://127.0.0.1:3838";
const testWithLiveSession = cookie && songId ? test : test.skip;
const NETEASE_SESSION_COOKIE_NAMES = new Set([
  "MUSIC_A",
  "MUSIC_R_U",
  "MUSIC_U",
  "NMTID",
  "__csrf",
]);

function toSessionCookieHeader(cookieBundle: string) {
  const session = new Map<string, string>();
  for (const part of cookieBundle.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    if (!NETEASE_SESSION_COOKIE_NAMES.has(name)) continue;
    session.set(name, part.slice(separator + 1).trim());
  }
  return [...session].map(([name, value]) => `${name}=${value}`).join("; ");
}

/**
 * 凭据只允许通过本机环境变量注入。测试模拟 Browser/Electron CookieJar 生成的标准
 * Cookie Header，不能把 Cookie 放入 URL、断言信息或仓库文件。
 */
testWithLiveSession(
  "backend accepts the session Cookie header and returns the complete VIP source",
  async () => {
    if (!cookie || !songId) throw new Error("Live music session test is not configured.");
    const sessionCookie = toSessionCookieHeader(cookie);
    expect(sessionCookie).toContain("MUSIC_U=");

    const endpoint = new URL("/song/url/v1", backendOrigin);
    endpoint.searchParams.set("id", songId);
    endpoint.searchParams.set("level", "lossless");

    expect(endpoint.searchParams.has("cookie")).toBeFalse();

    const response = await fetch(endpoint, {
      headers: { Cookie: sessionCookie },
      signal: AbortSignal.timeout(15_000),
    });
    expect(response.ok).toBeTrue();

    const payload = (await response.json()) as SongUrlV1Response;
    expect(payload.code).toBe(200);
    expect(payload.data).toHaveLength(1);

    const source = payload.data[0];
    expect(String(source.id)).toBe(songId);
    expect(source.url).toBeTruthy();
    expect(source.time).toBeGreaterThan(30_000);
    expect(source.freeTrialInfo).toBeNull();
  },
  20_000,
);
