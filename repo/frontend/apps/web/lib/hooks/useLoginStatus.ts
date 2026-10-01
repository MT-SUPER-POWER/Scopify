"use client";

import { useAuth } from "@/hooks/auth/useAuth";

const PLACEHOLDER_NICKNAMES = new Set(["未知用户", "未知使用者", "Unknown User"]);

export function isRealUser(
  user: { userId?: number; nickname?: string } | null | undefined,
): boolean {
  if (!user || typeof user.userId !== "number" || user.userId <= 0) return false;
  if (!user.nickname || typeof user.nickname !== "string") return false;
  const trimmed = user.nickname.trim();
  if (!trimmed || PLACEHOLDER_NICKNAMES.has(trimmed)) return false;
  return true;
}

/**
 * 兼容旧签名的 Hook
 * 底层直接代理至以 Cookie 凭据为核心的标准 useAuth().isAuthenticated
 */
export function useLoginStatus(): boolean {
  return useAuth().isAuthenticated;
}

export { useAuth };
