"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { IS_ELECTRON } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { LoginRequiredReason } from "@/types/auth";

type LoginAction = () => void | Promise<void>;

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function useRequireLoginAction() {
  const isLoggedIn = useLoginStatus();
  const smartRouter = useSmartRouter();
  const { t } = useI18n();

  return useCallback(
    async (reason: LoginRequiredReason, action: LoginAction) => {
      if (isLoggedIn) {
        await action();
        return true;
      }

      toast.info(t("login.required.toast"));
      if (IS_ELECTRON && window.electronAPI?.openLoginWindow) {
        window.electronAPI.openLoginWindow();
      } else {
        smartRouter.push("/login", {
          redirect: getCurrentPath(),
          reason,
        });
      }
      return false;
    },
    [isLoggedIn, smartRouter, t],
  );
}
