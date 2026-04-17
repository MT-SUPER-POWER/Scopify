"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store";

export function useLoginStatus(): boolean {
  const isStoreLogin = useUserStore((state) => !!state.user?.userId);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    // useEffect 只会在客户端浏览器执行
    const storage = localStorage.getItem("user_id");
    setIsLogin(isStoreLogin || !!storage);
  }, [isStoreLogin]);

  return isLogin;
}
