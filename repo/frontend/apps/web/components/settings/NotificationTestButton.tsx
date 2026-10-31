"use client";

import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useTranslation } from "react-i18next";

import type { NotificationTestButtonProps } from "@/types/notifications/components";

export function NotificationTestButton({ disabled, testing, onTest }: NotificationTestButtonProps) {
  const { t } = useTranslation();
  return (
    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onTest}>
      {testing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
      {t("notifications.test")}
    </Button>
  );
}
