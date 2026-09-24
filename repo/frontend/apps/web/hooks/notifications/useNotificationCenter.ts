"use client";

import { useEffect, useState } from "react";
import { useNotificationStore } from "@/store/module/notifications";
import { useUpdateNotification } from "./useUpdateNotification";
import { runtime } from "@/lib/runtime";
import { performNotificationAction } from "@/lib/notifications/actions";
import type { NotificationFilter, NotificationListItem } from "@/types/notifications";

export function useNotificationCenter() {
  const snapshot = useNotificationStore((state) => state.snapshot);
  const update = useUpdateNotification();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    setExpandedId(null);
  }, [snapshot?.accountId]);
  useEffect(() => {
    if (!snapshot?.focusId) return;
    setOpen(true);
    setFilter("all");
    setUnreadOnly(false);
    setExpandedId(snapshot.focusId);
    void performNotificationAction(() => runtime.notifications.markRead([snapshot.focusId!]));
  }, [snapshot?.focusId]);
  const items: NotificationListItem[] = [...(snapshot?.items ?? [])];
  if (update.item && snapshot?.preferences.updates !== false) items.push(update.item);
  items.sort((a, b) => b.occurredAt - a.occurredAt);
  const unreadCount = items.filter((item) => item.readAt === null).length;
  function markRead(item: NotificationListItem) {
    if (item.source === "updates") update.markRead();
    else void performNotificationAction(() => runtime.notifications.markRead([item.id]));
  }
  function readAll() {
    update.markRead();
    void performNotificationAction(() =>
      runtime.notifications.markRead(
        items
          .filter((item) => item.source !== "updates" && item.readAt === null)
          .map((item) => item.id),
      ),
    );
  }
  return {
    open,
    setOpen,
    mobile,
    filter,
    setFilter,
    unreadOnly,
    setUnreadOnly,
    expandedId,
    items: items.filter(
      (item) =>
        (filter === "all" || item.category === filter) &&
        (!unreadOnly || item.readAt === null || item.id === expandedId),
    ),
    unreadCount,
    markRead,
    readAll,
    update,
    expand(item: NotificationListItem) {
      setExpandedId((current) => (current === item.id ? null : item.id));
      markRead(item);
    },
  };
}
