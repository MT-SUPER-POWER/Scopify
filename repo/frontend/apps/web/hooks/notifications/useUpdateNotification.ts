"use client";

import { useEffect, useState } from "react";
import { useAppUpdater } from "@/hooks/settings/useAppUpdater";
import { UPDATE_SEEN_VERSION_KEY } from "@/constants/updater";
import { useI18n } from "@/store/module/i18n";
import type { NotificationListItem } from "@/types/notifications";

export function useUpdateNotification() {
  const updater = useAppUpdater();
  const { state } = updater;
  const { t } = useI18n();
  const [seenVersion, setSeenVersion] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState(0);
  useEffect(() => {
    setCreatedAt(Date.now());
    setSeenVersion(localStorage.getItem(UPDATE_SEEN_VERSION_KEY));
    const sync = (event: StorageEvent) => {
      if (event.key === UPDATE_SEEN_VERSION_KEY) setSeenVersion(event.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function markRead() {
    if (!state.version) return;
    localStorage.setItem(UPDATE_SEEN_VERSION_KEY, state.version);
    setSeenVersion(state.version);
  }
  const visible = ["available", "downloading", "downloaded", "checking", "error"].includes(
    state.status,
  );
  const status =
    state.status === "available" ||
    state.status === "downloading" ||
    state.status === "downloaded" ||
    state.status === "checking"
      ? state.status
      : "error";
  const description =
    state.status === "error" && state.message
      ? state.message
      : t(`notifications.updater.${status}.description`, {
          version: state.version ?? "",
          percent: Math.round(state.percent ?? 0),
        });
  const item: NotificationListItem | null =
    visible && createdAt
      ? {
          id: `updates:${state.version ?? status}`,
          source: "updates",
          category: "system",
          title: t(`notifications.updater.${status}.title`),
          body: description,
          occurredAt: state.lastCheckedAt ?? createdAt,
          readAt: !state.version || seenVersion === state.version ? createdAt : null,
          details: [description],
          progress:
            state.status === "downloading"
              ? Math.min(100, Math.max(0, state.percent ?? 0))
              : undefined,
          actionLabel:
            state.status === "downloaded"
              ? t("notifications.updater.install")
              : t("notifications.updater.openSettings"),
        }
      : null;
  return { item, markRead, updater };
}
