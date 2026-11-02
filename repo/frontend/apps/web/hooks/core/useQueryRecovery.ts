"use client";

import { focusManager, onlineManager, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { probeConnectivity, refetchFailedActiveQueries } from "@/lib/query/backendRecovery";
import { translate } from "@/lib/i18n";
import { queryRecovery } from "@/lib/query/recovery";
import { useI18nStore } from "@/store/module/i18n";

const CONNECTION_RESTORED_TOAST_ID = "connection-restored";

export function useConnectionStatus() {
  return useSyncExternalStore(
    queryRecovery.subscribe,
    queryRecovery.getSnapshot,
    queryRecovery.getSnapshot,
  );
}

/** 主窗口挂载一次：把联网、聚焦与请求成功信号接到全局恢复上。 */
export function useQueryRecoveryRuntime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const disconnect = queryRecovery.connect({
      probe: () => probeConnectivity(queryClient),
      onRecovered: (wasVisible) => {
        void refetchFailedActiveQueries(queryClient);
        if (!wasVisible) return;
        const locale = useI18nStore.getState().locale;
        toast.success(translate(locale, "network.recovery.restored"), {
          duration: 2_500,
          id: CONNECTION_RESTORED_TOAST_ID,
        });
      },
    });
    queryRecovery.setOnline(onlineManager.isOnline());
    const unsubscribeOnline = onlineManager.subscribe((online) => queryRecovery.setOnline(online));
    const unsubscribeFocus = focusManager.subscribe((focused) => {
      if (focused) queryRecovery.nudge();
    });
    const unsubscribeCache = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "success" && !event.action.manual)
        queryRecovery.noteSuccess();
    });
    return () => {
      disconnect();
      unsubscribeOnline();
      unsubscribeFocus();
      unsubscribeCache();
    };
  }, [queryClient]);
}

/** 距离下一次自动重试的秒数；没有排期时为 null。 */
export function useRetryCountdown(retryAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (retryAt === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [retryAt]);
  return retryAt === null ? null : Math.max(1, Math.ceil((retryAt - now) / 1_000));
}

/** 本地后端报错且当前页确实有区域在等待时，主内容区改为后端故障说明；设置页始终可用。 */
export function useBackendTakeover() {
  const pathname = usePathname();
  const { phase, waitingRegions } = useConnectionStatus();
  return phase === "backend" && waitingRegions > 0 && !pathname.startsWith("/setting");
}
