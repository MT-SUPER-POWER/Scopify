"use client";

import type { DesktopBackendStatus } from "@scopify/desktop-contract";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { translate } from "@/lib/i18n";
import { runtime } from "@/lib/runtime";
import { useI18nStore } from "@/store/module/i18n";

const BACKEND_ERROR_TOAST_ID = "desktop-backend-unavailable";

export function useBackendStatusNotification() {
  const router = useRouter();
  const lastFailureRef = useRef<string | null>(null);

  const handleStatus = useCallback(
    (status: DesktopBackendStatus) => {
      if (status.state !== "error") {
        lastFailureRef.current = null;
        if (status.state === "running") toast.dismiss(BACKEND_ERROR_TOAST_ID);
        return;
      }

      const locale = useI18nStore.getState().locale;
      const message =
        status.error?.trim() || translate(locale, "layout.backendUnavailableDescription");
      const failureKey = `${status.port}:${message}`;
      if (lastFailureRef.current === failureKey) return;
      lastFailureRef.current = failureKey;

      toast.error(translate(locale, "layout.backendUnavailableTitle"), {
        action: {
          label: translate(locale, "layout.openBackendSettings"),
          onClick: () => router.push("/setting"),
        },
        description: message,
        duration: 12_000,
        id: BACKEND_ERROR_TOAST_ID,
      });
    },
    [router],
  );

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
