"use client";

import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { NotificationTestButtonProps } from "@/types/components/notifications";

export function NotificationTestButton({ disabled, testing, onTest }: NotificationTestButtonProps) {
  const { t } = useI18n();
  return (
    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onTest}>
      {testing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
      {t("notifications.test")}
    </Button>
  );
}
