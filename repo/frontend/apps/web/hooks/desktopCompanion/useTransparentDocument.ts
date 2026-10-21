"use client";

import { useEffect } from "react";

/** 透明伴随窗口需要清掉 html/body 的主题背景，否则透明区域会露出底色。 */
export function useTransparentDocument() {
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    for (const target of targets)
      target.style.setProperty("background", "transparent", "important");
    return () => {
      for (const target of targets) target.style.removeProperty("background");
    };
  }, []);
}
