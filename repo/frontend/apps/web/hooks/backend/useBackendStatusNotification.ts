"use client";

import type { DesktopBackendStatus } from "@scopify/desktop-contract";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { translate } from "@/lib/i18n";
import { refetchFailedActiveQueries } from "@/lib/query/backendRecovery";
import { runtime } from "@/lib/runtime";
import { useI18nStore } from "@/store/module/i18n";

const BACKEND_ERROR_TOAST_ID = "desktop-backend-unavailable";

export function useBackendStatusNotification() {
  const queryClient = useQueryClient();
  const lastFailureRef = useRef<string | null>(null);
  const lastStateRef = useRef<DesktopBackendStatus["state"] | null>(null);

  const handleStatus = useCallback(
    (status: DesktopBackendStatus) => {
      const previousState = lastStateRef.current;
      lastStateRef.current = status.state;

      if (status.state !== "error") {
        lastFailureRef.current = null;
        if (status.state === "running") {
          toast.dismiss(BACKEND_ERROR_TOAST_ID);
          if (previousState !== "running") void refetchFailedActiveQueries(queryClient);
        }
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
          onClick: () => runtime.navigation.navigateMainWindow("/setting"),
        },
        description: message,
        duration: 12_000,
        id: BACKEND_ERROR_TOAST_ID,
      });
    },
    [queryClient],
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
