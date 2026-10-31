"use client";

import type { DesktopBackendStatus } from "@scopify/desktop-contract";
import { useCallback, useEffect } from "react";

import { translate } from "@/lib/i18n";
import { queryRecovery } from "@/lib/query/recovery";
import { runtime } from "@/lib/runtime";
import { useI18nStore } from "@/store/module/i18n";

/** 本地后端报错交给全局连接状态展示；恢复运行时由它统一重置等待区域并提示。 */
export function useBackendStatusNotification() {
  const handleStatus = useCallback((status: DesktopBackendStatus) => {
    if (status.state === "running" || status.state === "disabled") {
      queryRecovery.setBackendError(null);
      // 启动阶段失败的区域没有经过 error 状态，后端就绪后直接探测一次。
      if (status.state === "running") void queryRecovery.retryNow();
      return;
    }
    if (status.state !== "error") return;
    const locale = useI18nStore.getState().locale;
    queryRecovery.setBackendError(
      status.error?.trim() || translate(locale, "layout.backendUnavailableDescription"),
    );
  }, []);

  useEffect(() => {
    if (!runtime.isDesktop) return;

    let isMounted = true;
    void runtime.backend
      .getStatus()
      .then((status) => {
        if (isMounted) handleStatus(status);
      })
      .catch(() => {});

    const unsubscribe = runtime.backend.onStatusChanged((status) => {
      if (isMounted) handleStatus(status);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [handleStatus]);
}
