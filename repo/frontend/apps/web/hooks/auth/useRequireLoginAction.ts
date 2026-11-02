"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { useTranslation } from "react-i18next";

type LoginAction = () => void | Promise<void>;

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function useRequireLoginAction() {
  const isLoggedIn = useLoginStatus();
  const smartRouter = useSmartRouter();
  const { t } = useTranslation();

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
