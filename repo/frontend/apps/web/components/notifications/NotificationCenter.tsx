"use client";

import { Bell, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@scopify/ui/shadcn/components/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@scopify/ui/shadcn/components/sheet";
import { useNotificationCenter } from "@/hooks/notifications/useNotificationCenter";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationCenter() {
  const center = useNotificationCenter();
  const { t } = useI18n();
  const router = useSmartRouter();
  const trigger = (
    <button
      type="button"
      aria-label={`${t("notifications.title")} · ${t("notifications.unreadCount", { count: center.unreadCount })}`}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-full bg-surface-sunken/80 text-content-muted transition-colors hover:bg-surface-elevated hover:text-content focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        center.unreadCount > 0 && "text-brand",
      )}
    >
      <Bell className="size-4.5" aria-hidden="true" />
      {center.unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4.5 font-semibold text-brand-foreground ring-2 ring-surface">
          {center.unreadCount > 99 ? "99+" : center.unreadCount}
        </span>
      )}
    </button>
  );
  const content = (
    <NotificationPanel
      items={center.items}
      filter={center.filter}
      unreadOnly={center.unreadOnly}
      unreadCount={center.unreadCount}
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
  );
  if (center.mobile)
    return (
      <Sheet open={center.open} onOpenChange={center.setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-3xl border-border bg-surface-overlay p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetTitle className="sr-only">{t("notifications.title")}</SheetTitle>
          <SheetDescription className="sr-only">{t("notifications.subtitle")}</SheetDescription>
          <div className="flex justify-end px-4 pt-2">
            <SheetClose asChild>
              <button
                type="button"
                aria-label={t("notifications.close")}
                className="rounded-full p-2 text-content-muted"
              >
                <X className="size-4" />
              </button>
            </SheetClose>
          </div>
          {content}
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover open={center.open} onOpenChange={center.setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        collisionPadding={12}
        className="w-[min(440px,calc(100vw-24px))] overflow-hidden rounded-3xl border-border bg-surface-overlay p-0 shadow-floating"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
