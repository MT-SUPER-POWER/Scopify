"use client";

import { useCallback, useState } from "react";

import { getRememberedAppCloseAction } from "@/lib/runtime/appClose";
import { runtime } from "@/lib/runtime";
import type { AppCloseAction } from "@/lib/runtime/types";

export function useAppCloseState() {
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAction = useCallback(
    async (action: AppCloseAction) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const closeAction = getRememberedAppCloseAction(action);
        if (remember && closeAction !== null) {
          const config = await runtime.config.loadHostConfig();
          if (config) {
            await runtime.config.saveHostConfig({
              ...config,
              app: {
                ...config.app,
                closeAction,
              },
            });
          }
        }
      } catch (error) {
        void runtime.logging.write({
          level: "error",
          message: "Failed to persist the app close preference.",
          metadata: { error: String(error) },
          source: "action",
        });
      } finally {
        runtime.app.submitCloseAction(action);
      }
    },
    [isSubmitting, remember],
  );

  return {
    isSubmitting,
    remember,
    setRemember,
    submitAction,
  };
}
