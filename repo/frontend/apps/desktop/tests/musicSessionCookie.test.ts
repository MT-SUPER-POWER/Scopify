import { expect, test } from "bun:test";

import {
  createSessionCookieHeader,
  parseMusicSessionCookieBundle,
} from "@/main/utils/musicSessionCookie";

test("normalizes an aggregated Set-Cookie bundle into path-aware session cookies", () => {
  const cookies = parseMusicSessionCookieBundle(
    "MUSIC_U=member; Max-Age=3600; Path=/;; " +
      "MUSIC_R_T=feedback; Path=/api/feedback;; " +
      "__csrf=token; Path=/; HttpOnly",
  );

  expect(cookies).toEqual([
    { httpOnly: false, maxAge: 3600, name: "MUSIC_U", path: "/", value: "member" },
    { httpOnly: false, name: "MUSIC_R_T", path: "/api/feedback", value: "feedback" },
    { httpOnly: true, name: "__csrf", path: "/", value: "token" },
  ]);
  expect(createSessionCookieHeader(cookies, "/song/url/v1")).toBe("MUSIC_U=member; __csrf=token");
});

test("drops expired cookies when creating a request Cookie header", () => {
  const cookies = parseMusicSessionCookieBundle(
    "MUSIC_U=member; Path=/;; MUSIC_SNS=; Max-Age=0; Path=/",
  );

  expect(createSessionCookieHeader(cookies, "/user/account")).toBe("MUSIC_U=member");
});
