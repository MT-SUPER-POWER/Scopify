"use client";

import { CheckCheck, LoaderCircle, Moon, RefreshCw, Settings2 } from "lucide-react";
import { isNotificationQuiet } from "@scopify/notification-core";
import { useNotificationStore } from "@/store/module/notifications";
import { useI18n } from "@/store/module/i18n";
import { runtime } from "@/lib/runtime";
import { performNotificationAction } from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";
import type { NotificationPanelProps } from "@/types/components/notifications";
import { NotificationList } from "./NotificationList";

const FILTERS = ["all", "messages", "interactions", "reports", "system"] as const;
const actionClass =
  "rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-elevated hover:text-foreground disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NotificationPanel(props: NotificationPanelProps) {
  const { t, locale } = useI18n();
  const { snapshot, pending, localError } = useNotificationStore();
  const quiet = snapshot && isNotificationQuiet(snapshot.preferences);
  const syncing = snapshot?.syncing || pending;
  return (
    <section
      aria-label={t("notifications.title")}
      className="flex max-h-[min(42rem,80dvh)] min-h-0 flex-col overflow-hidden text-foreground"
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {t("notifications.title")}
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              {props.unreadCount}
            </span>
          </h2>
          <p className="mt-1 text-xs text-content-subtle">{t("notifications.subtitle")}</p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={props.onReadAll}
            disabled={!props.unreadCount || pending}
            title={t("notifications.readAll")}
            aria-label={t("notifications.readAll")}
            className={actionClass}
          >
            <CheckCheck className="size-4" />
          </button>
          <button
            type="button"
            onClick={props.onSettings}
            title={t("notifications.settings")}
            aria-label={t("notifications.settings")}
            className={actionClass}
          >
            <Settings2 className="size-4" />
          </button>
        </div>
      </header>
      <div className="flex items-center justify-between gap-2 border-y border-border/70 px-3 py-2">
        <div
          role="group"
          aria-label={t("notifications.title")}
          className="flex min-w-0 gap-0.5 overflow-x-auto"
        >
          {FILTERS.map((filter) => (
            <button
              type="button"
              key={filter}
              aria-pressed={props.filter === filter}
              onClick={() => props.onFilter(filter)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                props.filter === filter
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`notifications.${filter}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={props.unreadOnly}
          onClick={() => props.onUnreadOnly(!props.unreadOnly)}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            props.unreadOnly ? "bg-brand/10 text-brand" : "text-content-subtle",
          )}
        >
          {t("notifications.unread")}
        </button>
      </div>
      {(localError || Boolean(snapshot?.errors.length)) && (
        <p
          role="status"
          className="border-b border-border bg-warning/5 px-5 py-3 text-xs leading-relaxed text-warning"
        >
          {t(localError ? "notifications.localError" : "notifications.error")}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <NotificationList {...props} />
      </div>
      <footer className="flex min-h-12 items-center justify-between gap-3 border-t border-border/70 bg-surface-sunken/40 px-4 py-2 text-[11px] text-content-subtle">
        <span className="flex min-w-0 items-center gap-1.5" aria-live="polite">
          {quiet ? (
            <>
              <Moon className="size-3.5" />
              {t("notifications.quiet")}
            </>
          ) : syncing ? (
            t("notifications.checking")
          ) : !snapshot?.accountId ? (
            t("notifications.loginHint")
          ) : snapshot.lastCheckedAt ? (
            t("notifications.lastChecked", {
              time: new Date(snapshot.lastCheckedAt).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })
          ) : (
            t("notifications.subtitle")
          )}
        </span>
        <button
          type="button"
          disabled={Boolean(syncing) || !snapshot?.accountId}
          onClick={() => void performNotificationAction(() => runtime.notifications.refresh())}
          title={t("notifications.refresh")}
          aria-label={t("notifications.refresh")}
          className={actionClass}
        >
          {syncing ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </button>
      </footer>
    </section>
  );
}
