"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store";

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

export function useLoginStatus(): boolean {
  const user = useUserStore((state) => state.user);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    // 仅当拥有合法 userId 与非占位符真实昵称时，才判定为有效登录态
    setIsLogin(isRealUser(user));
  }, [user]);

  return isLogin;
}
