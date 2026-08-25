"use client";

import { useCallback, useState } from "react";

import { runtime } from "@/lib/runtime";
import type { AppCloseAction } from "@/lib/runtime/types";

export function useAppCloseState() {
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAction = useCallback(
    (action: AppCloseAction) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      runtime.app.submitCloseAction(action, remember);
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
