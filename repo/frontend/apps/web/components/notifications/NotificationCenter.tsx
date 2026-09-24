"use client";

import { Bell, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
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
import { NotificationPanel } from "./NotificationPanel";
import { socialNotificationHref } from "@/lib/social/notificationTarget";

export function NotificationCenter() {
  const center = useNotificationCenter();
  const { t } = useI18n();
  const router = useSmartRouter();
  const trigger = (
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
  );
  const content = (
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
      onSocialAction={(item) => {
        const href = socialNotificationHref(item.target);
        if (!href) return;
        center.markRead(item);
        center.setOpen(false);
        router.push(href);
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
          className="gap-0 rounded-t-2xl border-border bg-popover p-0 pb-[env(safe-area-inset-bottom)]"
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
        side="bottom"
        align="end"
        alignOffset={-80}
        sideOffset={8}
        arrowPadding={20}
        collisionPadding={12}
        className="w-[min(440px,calc(100vw-24px))] rounded-2xl border-border bg-popover p-0 shadow-floating"
      >
        <div className="overflow-hidden rounded-[inherit]">{content}</div>
        <PopoverPrimitive.Arrow asChild width={20} height={10}>
          <svg viewBox="0 0 20 10" className="overflow-visible" aria-hidden="true">
            <path
              d="M0 0 10 10 20 0"
              className="fill-popover stroke-border"
              strokeLinejoin="round"
            />
            <path d="M0 0H20" className="stroke-popover" strokeWidth={2} />
          </svg>
        </PopoverPrimitive.Arrow>
      </PopoverContent>
    </Popover>
  );
}
