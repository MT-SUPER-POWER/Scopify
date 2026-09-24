"use client";

import { useId } from "react";
import { BarChart3, Bell, Check, ChevronDown, Download, MessageCircle, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { NotificationRowProps } from "@/types/components/notifications";

export function NotificationRow({
  item,
  expanded,
  onExpand,
  onRead,
  onAction,
}: NotificationRowProps) {
  const { t, locale } = useI18n();
  const detailId = useId();
  const Icon =
    item.source === "updates"
      ? Download
      : item.category === "reports"
        ? BarChart3
        : item.category === "messages"
          ? MessageCircle
          : item.category === "interactions"
            ? AtSign
            : Bell;
  const unread = item.readAt === null;
  return (
    <article
      className={cn(
        "group rounded-2xl border transition-colors",
        unread ? "border-brand/15 bg-brand/5" : "border-transparent hover:bg-surface-elevated/70",
      )}
    >
      <div className="flex items-start gap-1 p-2">
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex min-w-0 flex-1 gap-3 rounded-xl p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl",
              unread ? "bg-brand/10 text-brand" : "bg-surface-sunken text-content-muted",
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{item.title}</span>
              {unread && (
                <span className="size-1.5 shrink-0 rounded-full bg-brand">
                  <span className="sr-only">{t("notifications.unread")}</span>
                </span>
              )}
            </span>
            <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
              {item.body}
            </span>
            <span className="mt-2 flex items-center gap-2 text-[11px] text-content-subtle">
              <time
                dateTime={new Date(item.occurredAt).toISOString()}
                title={new Date(item.occurredAt).toLocaleString(locale)}
              >
                {new Date(item.occurredAt).toLocaleString(locale, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <ChevronDown
                className={cn("size-3 transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
              <span className="sr-only">
                {t(expanded ? "notifications.collapse" : "notifications.expand")}
              </span>
            </span>
          </span>
        </button>
        {unread && (
          <button
            type="button"
            onClick={onRead}
            title={t("notifications.markRead")}
            aria-label={t("notifications.markRead")}
            className="mt-1 rounded-lg p-2 text-content-subtle hover:bg-surface-elevated hover:text-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Check className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {item.progress !== undefined && (
        <div
          role="progressbar"
          aria-label={item.title}
          aria-valuenow={Math.round(item.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mx-4 mb-3 h-1 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div className="h-full bg-brand transition-all" style={{ width: `${item.progress}%` }} />
        </div>
      )}
      {expanded && (
        <div id={detailId} className="mx-4 mb-4 border-t border-border/70 pt-3">
          <p className="mb-2 text-xs font-medium text-content-subtle">
            {t("notifications.summary")}
            {item.periodKey ? ` · ${item.periodKey}` : ""}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed break-words text-content-muted">
            {item.details.map((line, index) => (
              <li key={`${item.id}:${index}`} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mx-4 mb-4 rounded-lg border border-brand/20 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {item.actionLabel}
        </button>
      )}
    </article>
  );
}
