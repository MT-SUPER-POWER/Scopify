"use client";

import { BellRing } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { NotificationPanelProps } from "@/types/components/notifications";
import { NotificationRow } from "./NotificationRow";
import { socialNotificationHref } from "@/lib/social/notificationTarget";

export function NotificationList({
  items,
  unreadOnly,
  expandedId,
  onExpand,
  onRead,
  onUpdateAction,
  onSocialAction,
}: Pick<
  NotificationPanelProps,
  | "items"
  | "unreadOnly"
  | "expandedId"
  | "onExpand"
  | "onRead"
  | "onUpdateAction"
  | "onSocialAction"
>) {
  const { t, locale } = useI18n();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups = [
    {
      label: t("notifications.today"),
      date: today,
      items: items.filter((item) => item.occurredAt >= today.getTime()),
    },
    {
      label: t("notifications.yesterday"),
      date: yesterday,
      items: items.filter(
        (item) => item.occurredAt < today.getTime() && item.occurredAt >= yesterday.getTime(),
      ),
    },
    {
      label: t("notifications.earlier"),
      date: null,
      items: items.filter((item) => item.occurredAt < yesterday.getTime()),
    },
  ];
  if (!items.length)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-8 py-12 text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-surface-sunken text-content-subtle">
          <BellRing className="size-7" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-foreground">
          {t(unreadOnly ? "notifications.noUnread" : "notifications.noItems")}
        </p>
        <p className="mt-2 max-w-64 text-xs leading-relaxed text-muted-foreground">
          {t("notifications.noItemsHint")}
        </p>
      </div>
    );
  return (
    <div className="space-y-5 px-3 pt-1 pb-4">
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section key={group.label}>
            <h3 className="mb-2 flex items-center gap-3 px-2 text-xs font-medium text-content-muted">
              <span>{group.label}</span>
              {group.date && (
                <span className="font-normal text-content-subtle">
                  {group.date.toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
              )}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={
                    socialNotificationHref(item.target)
                      ? { ...item, actionLabel: t("social.notificationOpen") }
                      : item
                  }
                  expanded={expandedId === item.id}
                  onExpand={() => onExpand(item)}
                  onRead={() => onRead(item)}
                  onAction={
                    item.source === "updates"
                      ? onUpdateAction
                      : socialNotificationHref(item.target)
                        ? () => onSocialAction(item)
                        : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
