"use client";

import { BellRing } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { NotificationPanelProps } from "@/types/components/notifications";
import { NotificationRow } from "./NotificationRow";

export function NotificationList({
  items,
  unreadOnly,
  expandedId,
  onExpand,
  onRead,
  onUpdateAction,
}: Pick<
  NotificationPanelProps,
  "items" | "unreadOnly" | "expandedId" | "onExpand" | "onRead" | "onUpdateAction"
>) {
  const { t } = useI18n();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups = [
    {
      label: t("notifications.today"),
      items: items.filter((item) => item.occurredAt >= today.getTime()),
    },
    {
      label: t("notifications.yesterday"),
      items: items.filter(
        (item) => item.occurredAt < today.getTime() && item.occurredAt >= yesterday.getTime(),
      ),
    },
    {
      label: t("notifications.earlier"),
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
    <div className="space-y-5 p-3">
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section key={group.label}>
            <h3 className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-content-subtle">
              {group.label}
            </h3>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onExpand={() => onExpand(item)}
                  onRead={() => onRead(item)}
                  onAction={item.source === "updates" ? onUpdateAction : undefined}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
