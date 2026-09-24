"use client";

import { CheckCheck, Settings2 } from "lucide-react";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useNotificationStore } from "@/store/module/notifications";
import type { NotificationToolbarProps } from "@/types/components/notifications";

const filters = ["all", "comments", "mentions", "notices", "reports", "updates"] as const;
const actionClass =
  "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-content-muted transition-colors hover:bg-foreground/7 hover:text-foreground disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NotificationToolbar(props: NotificationToolbarProps) {
  const { t } = useI18n();
  const pending = useNotificationStore((state) => state.pending);
  return (
    <header className="shrink-0 px-4 pt-2">
      <div className="flex items-center gap-1 border-b border-border">
        <div
          role="group"
          aria-label={t("notifications.title")}
          className="hide-scrollbar flex min-w-0 flex-1 overflow-x-auto"
        >
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              aria-pressed={props.filter === filter}
              onClick={() => props.onFilter(filter)}
              className={cn(
                "shrink-0 border-b-2 px-2 py-3 text-[15px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
                props.filter === filter
                  ? "border-foreground font-semibold text-foreground"
                  : "border-transparent text-content-muted hover:text-foreground",
              )}
            >
              {t(`notifications.tab.${filter}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={props.onSettings}
          title={t("notifications.settings")}
          aria-label={t("notifications.settings")}
          className={actionClass}
        >
          <Settings2 className="size-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-2 text-xs text-content-muted">
        <span aria-live="polite">
          {t("notifications.unreadCount", { count: props.unreadCount })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onReadAll}
            disabled={!props.unreadCount || pending}
            title={t(
              props.filter === "all" ? "notifications.readAll" : "notifications.readCategory",
            )}
            className={actionClass}
          >
            <CheckCheck className="size-3.5" aria-hidden="true" />
            {t("notifications.readAll")}
          </button>
          <label className="flex cursor-pointer items-center gap-2">
            {t("notifications.unreadOnly")}
            <Switch
              size="sm"
              checked={props.unreadOnly}
              onCheckedChange={props.onUnreadOnly}
              aria-label={t("notifications.unreadOnly")}
              className="data-[state=checked]:bg-foreground/30 data-[state=unchecked]:bg-foreground/12 [&_[data-slot=switch-thumb]]:bg-foreground"
            />
          </label>
        </div>
      </div>
    </header>
  );
}
