import { describe, expect, it } from "bun:test";
import { getAuthStatus } from "@/hooks/auth/useAuth";
import { pruneUser } from "@/types/api/user";

describe("getAuthStatus (以 Cookie 凭据为核心的用户认证标准)", () => {
  const validUser = pruneUser({
    userId: 123456,
    nickname: "Test User",
    avatarUrl: "https://example.com/avatar.jpg",
  });

  it("当既无 Cookie 凭据也无用户画像时，判定为纯未登录路人 (isAnonymous)", () => {
    const status = getAuthStatus(null, false, null);
    expect(status.isAuthenticated).toBe(false);
    expect(status.isGuest).toBe(false);
    expect(status.isAnonymous).toBe(true);
    expect(status.hasCredential).toBe(false);
    expect(status.hasUser).toBe(false);
    expect(status.accountId).toBe(null);
    expect(status.user).toBe(null);
  });

  it("老用户升级场景：拥有有效 Cookie 和真实用户画像，但 loginType 为空，自动判定为正式登录用户", () => {
    const status = getAuthStatus(validUser, true, null);
    expect(status.isAuthenticated).toBe(true);
    expect(status.isGuest).toBe(false);
    expect(status.isAnonymous).toBe(false);
    expect(status.hasCredential).toBe(true);
    expect(status.hasUser).toBe(true);
    expect(status.accountId).toBe("123456");
    expect(status.userId).toBe(123456);
    expect(status.user).toEqual(validUser);
  });

  it("正常扫码登录场景：拥有有效 Cookie 和真实用户画像，loginType 为 'qr'，判定为正式登录用户", () => {
    const status = getAuthStatus(validUser, true, "qr");
    expect(status.isAuthenticated).toBe(true);
    expect(status.isGuest).toBe(false);
    expect(status.accountId).toBe("123456");
    expect(status.loginType).toBe("qr");
  });

  it("UID 访客场景：本地有用户画像但手里没有 Cookie 凭据，判定为只读访客 (isGuest)", () => {
    const status = getAuthStatus(validUser, false, "uid");
    expect(status.isAuthenticated).toBe(false);
    expect(status.isGuest).toBe(true);
    expect(status.isAnonymous).toBe(false);
    expect(status.hasCredential).toBe(false);
    expect(status.hasUser).toBe(true);
    expect(status.accountId).toBe(null);
  });

  it("即使有 Cookie，但用户画像为占位符（如 '未知用户' 或 userId <= 0）时，不判定为已认证", () => {
    const placeholderUser = pruneUser({
      userId: 123456,
      nickname: "未知用户",
      avatarUrl: "",
    });
    const status = getAuthStatus(placeholderUser, true, "qr");
    expect(status.isAuthenticated).toBe(false);
    expect(status.hasUser).toBe(false);
    expect(status.accountId).toBe(null);
  });

  it("有 Cookie 但无用户画像场景：判定 hasCredential 为 true 但尚未认证 (isAuthenticated: false)，等待自愈水合", () => {
    const status = getAuthStatus(null, true, null);
    expect(status.isAuthenticated).toBe(false);
    expect(status.hasCredential).toBe(true);
    expect(status.hasUser).toBe(false);
    expect(status.isAnonymous).toBe(false);
  });
});
