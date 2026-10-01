"use client";

import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { NotificationTestButtonProps } from "@/types/components/notifications";

export function NotificationTestButton({
  disabled,
  hasChanges,
  testing,
  result,
  onTest,
}: NotificationTestButtonProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onTest}>
        {testing ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {t("notifications.test")}
      </Button>
      {hasChanges ? (
        <p className="max-w-48 text-right text-[11px] text-muted-foreground">
          {t("notifications.testSaveFirst")}
        </p>
      ) : result ? (
        <p role="status" className="max-w-48 text-right text-[11px] text-muted-foreground">
          {t(result === "sent" ? "notifications.testSent" : "notifications.testBlocked")}
        </p>
      ) : null}
    </div>
  );
}
