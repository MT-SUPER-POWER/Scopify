"use client";

import { useI18n } from "@/store/module/i18n";
import type { NotificationSummaryProps } from "@/types/components/notifications";

export function NotificationSummary({
  item,
  expanded,
  detailId,
  onAction,
}: NotificationSummaryProps) {
  const { t } = useI18n();
  return (
    <>
      {item.progress !== undefined && (
        <div
          role="progressbar"
          aria-label={item.title}
          aria-valuenow={Math.round(item.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mx-3 mb-3 h-1 overflow-hidden rounded-full bg-foreground/7"
        >
          <div
            className="h-full bg-foreground/60 transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
      {expanded && (
        <div id={detailId} className="mx-3 border-t border-border/50 py-3">
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
          className="mx-3 mb-3 rounded-lg bg-foreground/7 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/12 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {item.actionLabel}
        </button>
      )}
    </>
  );
}
