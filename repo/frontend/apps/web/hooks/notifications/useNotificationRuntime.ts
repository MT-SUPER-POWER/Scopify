"use client";

import { useEffect } from "react";
import { runtime } from "@/lib/runtime";
import { useUserStore } from "@/store/module/user";
import { useI18n } from "@/store/module/i18n";
import { useNotificationStore } from "@/store/module/notifications";

/** Mounted once in the dashboard; the popover itself never owns a scheduler. */
export function useNotificationRuntime() {
  const userId = useUserStore((state) => state.user?.userId);
  const loginType = useUserStore((state) => state.loginType);
  const accountId = userId && loginType && loginType !== "uid" ? String(userId) : null;
  const { locale } = useI18n();
  useEffect(() => {
    let disposed = false;
    const store = useNotificationStore.getState();
    store.selectAccount(accountId);
    const accept = (snapshot: Parameters<typeof store.accept>[0]) => {
      if (!disposed) store.accept(snapshot);
    };
    const unsubscribe = runtime.notifications.onChanged(accept);
    void runtime.notifications
      .configure({ accountId, locale })
      .then(accept)
      .catch(() => {
        if (!disposed) useNotificationStore.setState({ localError: true });
      });
    const onOnline = () => {
      void runtime.notifications
        .refresh()
        .then(accept)
        .catch(() => {
          if (!disposed) useNotificationStore.setState({ localError: true });
        });
    };
    window.addEventListener("online", onOnline);
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, [accountId, locale]);
}
