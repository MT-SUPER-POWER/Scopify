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
    <div>
      <Button type="button" variant="outline" disabled={disabled} onClick={onTest}>
        {testing ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        {t("notifications.test")}
      </Button>
      {hasChanges ? (
        <p className="mt-2 text-xs text-muted-foreground">{t("notifications.testSaveFirst")}</p>
      ) : result ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {t(result === "sent" ? "notifications.testSent" : "notifications.testBlocked")}
        </p>
      ) : null}
    </div>
  );
}
