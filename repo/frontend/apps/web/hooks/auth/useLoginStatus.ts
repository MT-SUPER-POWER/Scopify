"use client";

import { useAuth } from "@/hooks/auth/useAuth";

/**
 * 兼容旧签名的 Hook
 * 底层直接代理至以 Cookie 凭据为核心的标准 useAuth().isAuthenticated
 */
export function useLoginStatus(): boolean {
  return useAuth().isAuthenticated;
}
