"use client";

import { Bell } from "lucide-react";
import { InboxPopover } from "@/components/inbox/InboxPopover";
import { useNotificationCenter } from "@/hooks/notifications/useNotificationCenter";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationCenter() {
  const center = useNotificationCenter();
  const { t } = useI18n();
  const router = useSmartRouter();
  return (
    <InboxPopover
      open={center.open}
      onOpenChange={center.setOpen}
      title={t("notifications.title")}
      description={t("notifications.subtitle")}
      trigger={
        <button
          type="button"
          aria-label={`${t("notifications.title")} · ${t("notifications.unreadCount", { count: center.unreadCount })}`}
          className="flex size-10 items-center justify-center rounded-full bg-surface-sunken/80 text-content-muted transition-colors hover:bg-surface-elevated hover:text-content focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="relative inline-flex size-4.5" aria-hidden="true">
            <Bell className="size-4.5" />
            {center.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success ring-2 ring-surface" />
            )}
          </span>
        </button>
      }
    >
      <NotificationPanel
        items={center.items}
        filter={center.filter}
        unreadOnly={center.unreadOnly}
        unreadCount={center.filterUnreadCount}
        expandedId={center.expandedId}
        onFilter={center.setFilter}
        onUnreadOnly={center.setUnreadOnly}
        onExpand={center.expand}
        onRead={center.markRead}
        onReadAll={center.readAll}
        onSettings={() => {
          center.setOpen(false);
          router.push("/setting?tab=notifications");
        }}
        onUpdateAction={() => {
          center.update.markRead();
          if (center.update.updater.state.status === "downloaded") center.update.updater.install();
          else {
            center.setOpen(false);
            router.push("/setting?tab=desktop#app-updater");
          }
        }}
      />
    </InboxPopover>
  );
}
