"use client";

import { useEffect, useState } from "react";
import type { NotificationPreferences } from "@scopify/desktop-contract";
import { toast } from "sonner";
import { runtime } from "@/lib/runtime";
import { performNotificationAction } from "@/lib/notifications/actions";
import { useNotificationStore } from "@/store/module/notifications";
import { useI18n } from "@/store/module/i18n";
import type { NotificationPreferencesDraft } from "@/types/notifications";

export function useNotificationPreferences() {
  const store = useNotificationStore();
  const { t } = useI18n();
  const [draft, setDraft] = useState<NotificationPreferencesDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<"sent" | "blocked" | null>(null);
  const [testing, setTesting] = useState(false);
  const preferences =
    draft?.accountId === store.accountId ? draft.preferences : store.snapshot?.preferences;
  const hasChanges =
    !!preferences && JSON.stringify(preferences) !== JSON.stringify(store.snapshot?.preferences);

  useEffect(() => {
    setDraft(null);
    setTestResult(null);
  }, [store.accountId]);

  function change(patch: Partial<NotificationPreferences>) {
    const current = useNotificationStore.getState();
    if (!current.snapshot || current.pending || testing || current.accountId !== store.accountId)
      return;
    setTestResult(null);
    const saved = current.snapshot.preferences;
    setDraft((previous) => ({
      accountId: current.accountId,
      preferences: {
        ...(previous?.accountId === current.accountId ? previous.preferences : saved),
        ...patch,
      },
    }));
  }

  function reset() {
    setDraft(null);
    setTestResult(null);
    useNotificationStore.setState({ localError: false });
  }

  async function save() {
    const current = useNotificationStore.getState();
    if (
      !current.snapshot ||
      !hasChanges ||
      !preferences ||
      current.pending ||
      testing ||
      current.accountId !== store.accountId
    )
      return;
    setSaving(true);
    const saved = await performNotificationAction(() =>
      runtime.notifications.updatePreferences(preferences),
    );
    setSaving(false);
    if (
      !saved ||
      saved.accountId !== current.accountId ||
      useNotificationStore.getState().accountId !== current.accountId
    ) {
      toast.error(t("settings.saveFailed"));
      return;
    }
    setDraft(null);
    toast.success(t("settings.saveSuccess"));
  }

  async function test() {
    if (hasChanges || store.pending || testing || !store.snapshot?.preferences.desktop) return;
    setTesting(true);
    try {
      const ok = await runtime.notifications.testDesktop();
      setTestResult(ok ? "sent" : "blocked");
      if (!ok) toast.warning(t("notifications.testBlocked"));
    } catch {
      setTestResult("blocked");
      toast.warning(t("notifications.testBlocked"));
    } finally {
      setTesting(false);
    }
  }
  return {
    ...store,
    preferences,
    hasChanges,
    saving,
    change,
    reset,
    save,
    test,
    testResult,
    testing,
  };
}
