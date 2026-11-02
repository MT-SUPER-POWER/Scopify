"use client";

import { useCallback, useState } from "react";
import { runtime } from "@/lib/runtime";

/** 重启本地后端；结果通过后端状态事件回到全局连接状态，这里只管按钮的进行中状态。 */
export function useBackendRestart() {
  const [isRestarting, setIsRestarting] = useState(false);
  const restart = useCallback(async () => {
    setIsRestarting(true);
    try {
      await runtime.backend.restart();
    } catch {
      // 失败会以 error 状态事件回传，由连接状态展示。
    } finally {
      setIsRestarting(false);
    }
  }, []);
  return { isRestarting, restart };
}
