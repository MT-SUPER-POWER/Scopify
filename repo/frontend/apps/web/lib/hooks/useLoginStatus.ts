"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store";

export function useLoginStatus(): boolean {
  const isStoreLogin = useUserStore((state) => !!state.user?.userId);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    // useEffect 只会在客户端浏览器执行
    const storageUserId = localStorage.getItem("user_id");
    // CookieJar 凭据可能是 HttpOnly，登录展示只依赖已验证并缓存的账号身份。
    setIsLogin(Boolean(isStoreLogin || storageUserId));
  }, [isStoreLogin]);

  return isLogin;
}
