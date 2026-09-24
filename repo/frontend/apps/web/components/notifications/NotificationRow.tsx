"use client";

import { useId } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { NotificationRowProps } from "@/types/components/notifications";
import { NotificationAvatar } from "./NotificationAvatar";
import { NotificationSummary } from "./NotificationSummary";
import { NotificationPreview } from "./NotificationPreview";

export function NotificationRow({
  item,
  expanded,
  onExpand,
  onRead,
  onAction,
}: NotificationRowProps) {
  const { t, locale } = useI18n();
  const detailId = useId();
  const unread = item.readAt === null;
  const report = item.category === "reports";
  const titleDivider = report ? -1 : item.title.lastIndexOf(" · ");
  const title =
    item.social?.actor || (titleDivider < 0 ? item.title : item.title.slice(0, titleDivider));
  const sourceLabel =
    item.social?.action || (titleDivider < 0 ? null : item.title.slice(titleDivider + 3));
  const date = new Date(item.occurredAt);
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const time =
    date >= yesterday
      ? date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString(locale, {
          month: "2-digit",
          day: "2-digit",
          ...(date.getFullYear() !== yesterday.getFullYear() ? { year: "numeric" as const } : {}),
        });
  return (
    <article
      data-unread={unread}
      className={cn(
        "group rounded-xl transition-colors hover:bg-foreground/7",
        unread && "bg-foreground/7",
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex w-full items-start gap-3.5 rounded-xl px-3 py-4 pr-9 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <NotificationAvatar item={item} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span
                  className="max-w-full truncate text-[15px] leading-6 font-semibold text-foreground"
                  title={title}
                >
                  {title}
                </span>
                {unread && (
                  <span className="size-1.5 shrink-0 rounded-full bg-success">
                    <span className="sr-only">{t("notifications.unread")}</span>
                  </span>
                )}
                {sourceLabel && (
                  <span className="text-[13px] leading-5 text-content-muted">{sourceLabel}</span>
                )}
              </span>
              <time
                dateTime={date.toISOString()}
                title={date.toLocaleString(locale)}
                className="shrink-0 self-start pt-1 text-xs text-content-muted"
              >
                {time}
              </time>
            </span>
            <NotificationPreview item={item} />
          </span>
          <ChevronRight
            className={cn(
              "absolute top-5 right-3 size-3.5 text-content-muted transition-transform",
              expanded && "rotate-90",
              unread && "group-focus-within:opacity-0 group-hover:opacity-0",
            )}
            aria-hidden="true"
          />
          <span className="sr-only">
            {t(expanded ? "notifications.collapse" : "notifications.expand")}
          </span>
        </button>
        {unread && (
          <button
            type="button"
            onClick={onRead}
            title={t("notifications.markRead")}
            aria-label={t("notifications.markRead")}
            className="absolute top-3 right-1.5 rounded-lg p-1.5 text-content-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-foreground/7 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [@media(hover:none)]:opacity-100"
          >
            <Check className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <NotificationSummary
        item={item}
        expanded={expanded}
        detailId={detailId}
        onAction={onAction}
      />
    </article>
  );
}
