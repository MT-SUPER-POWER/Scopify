"use client";

import { useState } from "react";
import type { NotificationPreferences } from "@scopify/desktop-contract";
import { runtime } from "@/lib/runtime";
import { performNotificationAction } from "@/lib/notifications/actions";
import { useNotificationStore } from "@/store/module/notifications";

export function useNotificationPreferences() {
  const store = useNotificationStore();
  const [testResult, setTestResult] = useState<"sent" | "blocked" | null>(null);
  const [testing, setTesting] = useState(false);
  function change(patch: Partial<NotificationPreferences>) {
    const current = useNotificationStore.getState();
    if (!current.snapshot || current.pending) return;
    setTestResult(null);
    void performNotificationAction(() =>
      runtime.notifications.updatePreferences({ ...current.snapshot!.preferences, ...patch }),
    );
  }
  async function test() {
    setTesting(true);
    try {
      setTestResult((await runtime.notifications.testDesktop()) ? "sent" : "blocked");
    } catch {
      setTestResult("blocked");
    } finally {
      setTesting(false);
    }
  }
  return { ...store, change, test, testResult, testing };
}
