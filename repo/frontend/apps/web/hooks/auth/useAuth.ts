"use client";

import { useSyncExternalStore } from "react";
import { useUserStore } from "@/store/module/user";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import {
  getMusicSessionCredential,
  MUSIC_SESSION_CHANGED_EVENT,
} from "@/lib/web/musicSessionCredential";
import type { AuthStatus, LoginType } from "@/types/auth";
import type { NeteaseUser } from "@/types/api/user";

/**
 * 统一认证状态管理 Hook
 * 以网易云会话 Cookie 凭据为核心判定依据 (Source of Truth)，提供全站统一的鉴权与身份信息
 */

/** 订阅 localStorage 中 music_cookie 的变更（支持同页事件与跨标签页 storage 事件） */
function subscribeCredential(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(MUSIC_SESSION_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(MUSIC_SESSION_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCredentialSnapshot(): boolean {
  return Boolean(getMusicSessionCredential());
}

function getServerCredentialSnapshot(): boolean {
  return false;
}

/**
 * 纯函数计算认证状态，用于单元测试与非 React 上下文
 * @param user - 用户对象
 * @param hasCredential - 是否拥有会话凭据
 * @param loginType - 登录方式元数据
 * @returns 完整的 AuthStatus 状态结构
 */
export function getAuthStatus(
  user: NeteaseUser | null | undefined,
  hasCredential: boolean,
  loginType: LoginType,
): AuthStatus {
  const hasUser = isRealUser(user);
  const isAuthenticated = hasCredential && hasUser;
  const isGuest = !hasCredential && hasUser;
  const isAnonymous = !hasCredential && !hasUser;
  const numericUserId = hasUser && user?.userId ? user.userId : null;

  return {
    isAuthenticated,
    isGuest,
    isAnonymous,
    hasCredential,
    hasUser,
    userId: numericUserId,
    accountId: isAuthenticated && numericUserId ? String(numericUserId) : null,
    user: hasUser && user ? user : null,
    loginType,
  };
}

/**
 * 全站统一的认证状态 Hook
 * 零延迟响应式，以 Cookie 为鉴权本位，彻底解耦对临时 loginType 标签的依赖
 */
export function useAuth(): AuthStatus {
  const user = useUserStore((state) => state.user);
  const loginType = useUserStore((state) => state.loginType);
  const hasCredential = useSyncExternalStore(
    subscribeCredential,
    getCredentialSnapshot,
    getServerCredentialSnapshot,
  );

  return getAuthStatus(user, hasCredential, loginType);
}
