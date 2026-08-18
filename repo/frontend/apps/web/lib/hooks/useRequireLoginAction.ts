"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";

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
    async (action: LoginAction) => {
      if (isLoggedIn) {
        await action();
        return true;
      }

      toast.info(t("login.required.toast"));
      if (!runtime.auth.openLoginWindow()) {
        smartRouter.push("/login", {
          redirect: getCurrentPath(),
        });
      }
      return false;
    },
    [isLoggedIn, smartRouter, t],
  );
}
