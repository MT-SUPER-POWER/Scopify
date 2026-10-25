"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { runtime } from "@/lib/runtime";

/** 桌面端系统窗口按钮叠加在顶栏上，图标颜色随明暗主题切换以保持可见。 */
export function useTitleBarSymbolColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    runtime.window.setTitleBarSymbolColor(resolvedTheme === "dark" ? "#ffffff" : "#111111");
  }, [resolvedTheme]);
}
