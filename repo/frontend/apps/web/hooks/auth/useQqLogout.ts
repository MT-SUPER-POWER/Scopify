"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useSwitchProvider } from "@/hooks/provider/useSwitchProvider";
import { logoutQq } from "@/lib/providers/qq/api/login";
import { clearQqSessionToken } from "@/lib/providers/qq/session";
import { useActiveProviderStore } from "@/store/module/provider";

/**
 * Signs out of QQ Music only. NetEase's session stays; if QQ was active the app goes back to
 * NetEase, the platform shown while signed out.
 */
export function useQqLogout() {
  const queryClient = useQueryClient();
  const switchProvider = useSwitchProvider();

  return useCallback(async () => {
    try {
      await logoutQq();
    } catch {
      /* The local session is dropped even if the backend cannot be reached. */
    }
    clearQqSessionToken();
    queryClient.removeQueries({ queryKey: ["qq"] });
    if (useActiveProviderStore.getState().activeProvider === "qq") {
      await switchProvider("netease");
    }
  }, [queryClient, switchProvider]);
}
