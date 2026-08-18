"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";

export function useLoginStatus(): boolean {
  const isStoreLogin = useUserStore((state) => !!state.user?.userId);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    // useEffect 只会在客户端浏览器执行
    const storageUserId = localStorage.getItem("user_id");
    const cookie = getMusicSessionCredential();
    setIsLogin(Boolean(cookie && (isStoreLogin || storageUserId)));
  }, [isStoreLogin]);

  return isLogin;
}
