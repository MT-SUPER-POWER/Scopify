import { expect, test } from "bun:test";

import { toQqAccountProfile } from "@/lib/providers/qq/adapters/account";
import { qqSessionTokenFromCookie } from "@/lib/providers/qq/session";

test("reads the session token out of the QR check cookie", () => {
  expect(qqSessionTokenFromCookie("qqmusic_session=abc.def")).toBe("abc.def");
  expect(qqSessionTokenFromCookie("a=1; qqmusic_session= tok ; b=2")).toBe("tok");
  expect(qqSessionTokenFromCookie("qqmusic_session=")).toBeNull();
  expect(qqSessionTokenFromCookie("other=1")).toBeNull();
  expect(qqSessionTokenFromCookie(undefined)).toBeNull();
});

test("prefers the upstream nickname and avatar over the credential fields", () => {
  expect(
    toQqAccountProfile({
      musicid: 123,
      str_musicid: "123",
      nickname: "from credential",
      avatarUrl: "https://example.invalid/a.jpg",
      info: { nick: "Upstream", logo: "https://example.invalid/b.jpg" },
    }),
  ).toEqual({
    provider: "qq",
    accountId: "123",
    nickname: "Upstream",
    avatarUrl: "https://example.invalid/b.jpg",
  });
});

test("treats a profile without any identity as no account", () => {
  expect(toQqAccountProfile(undefined)).toBeNull();
  expect(toQqAccountProfile({})).toBeNull();
  expect(toQqAccountProfile({ info: {} })).toBeNull();
  expect(toQqAccountProfile({ musicid: 42 })).toEqual({
    provider: "qq",
    accountId: "42",
    nickname: "42",
  });
});
