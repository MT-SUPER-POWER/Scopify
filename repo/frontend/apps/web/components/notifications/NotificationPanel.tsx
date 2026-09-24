"use client";

import { LoaderCircle, Moon, RefreshCw } from "lucide-react";
import { isNotificationQuiet } from "@scopify/notification-core";
import { ScrollArea } from "@scopify/ui/shadcn/components/scroll-area";
import { useNotificationStore } from "@/store/module/notifications";
import { useI18n } from "@/store/module/i18n";
import { runtime } from "@/lib/runtime";
import { performNotificationAction } from "@/lib/notifications/actions";
import type { NotificationPanelProps } from "@/types/components/notifications";
import { NotificationList } from "./NotificationList";
import { NotificationToolbar } from "./NotificationToolbar";

const actionClass =
  "flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-content-muted transition-colors hover:bg-foreground/7 hover:text-foreground disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NotificationPanel(props: NotificationPanelProps) {
  const { t, locale } = useI18n();
  const { snapshot, pending, localError } = useNotificationStore();
  const quiet = snapshot && isNotificationQuiet(snapshot.preferences);
  const syncing = snapshot?.syncing || pending;
  return (
    <section
      aria-label={t("notifications.title")}
      className="flex max-h-[min(40rem,calc(100dvh-10rem))] min-h-0 flex-col overflow-hidden text-foreground"
    >
      <NotificationToolbar {...props} />
      {(localError || Boolean(snapshot?.errors.length)) && (
        <p
          role="status"
          className="border-b border-border bg-warning/5 px-5 py-3 text-xs leading-relaxed text-warning"
        >
          {t(localError ? "notifications.localError" : "notifications.error")}
        </p>
      )}
      <ScrollArea
        type="hover"
        className="flex min-h-0 flex-1 flex-col [&_[data-slot=scroll-area-thumb]]:bg-foreground/15 [&_[data-slot=scroll-area-thumb]:hover]:bg-foreground/25 [&>[data-slot=scroll-area-scrollbar]]:w-1.5 [&>[data-slot=scroll-area-viewport]]:h-auto [&>[data-slot=scroll-area-viewport]]:min-h-0 [&>[data-slot=scroll-area-viewport]]:flex-1 [&>[data-slot=scroll-area-viewport]]:overscroll-contain"
      >
        <div className="[contain:inline-size]">
          <NotificationList {...props} />
        </div>
      </ScrollArea>
      <footer className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-t border-border/50 px-4 py-2 text-xs text-content-subtle">
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
          <span>{t("notifications.refreshShort")}</span>
        </button>
      </footer>
    </section>
  );
}
