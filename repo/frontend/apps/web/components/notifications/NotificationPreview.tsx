"use client";

import { useI18n } from "@/store/module/i18n";
import type { NotificationPreviewProps } from "@/types/components/notifications";

export function NotificationPreview({ item }: NotificationPreviewProps) {
  const { t } = useI18n();
  const report = item.category === "reports";
  const bodyParts = report ? item.body.split(" · ") : [];
  const reportDate = /^\d{4}-\d{2}-\d{2}$/.test(bodyParts[0] ?? "") ? bodyParts.shift() : null;
  return (
    <>
      {reportDate && <span className="mt-1 block text-xs text-content-muted">{reportDate}</span>}
      {item.body && item.body !== item.social?.quote && (
        <span className="mt-1.5 line-clamp-2 text-sm leading-6 break-words text-foreground/90">
          {report ? bodyParts.join(" · ") : item.body}
        </span>
      )}
      {item.social?.quote && (
        <span className="mt-2 block rounded-lg bg-foreground/6 px-3 py-2 text-[13px] leading-5 text-content-muted">
          <span className="line-clamp-2 break-words">
            {item.social.quoteAuthor && (
              <span className="mr-1 text-foreground/85">{item.social.quoteAuthor}：</span>
            )}
            {item.social.quote}
          </span>
        </span>
      )}
      {item.social?.resource && (
        <span className="mt-1.5 block truncate text-xs text-content-muted">
          {t("notifications.fromResource", { resource: item.social.resource })}
        </span>
      )}
    </>
  );
}
