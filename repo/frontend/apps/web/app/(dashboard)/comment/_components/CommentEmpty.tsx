"use client";

import { MessageCircle } from "lucide-react";
import { useI18n } from "@/store/module/i18n";

export function CommentEmpty() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-content-muted">
      <MessageCircle className="size-16 opacity-30" />
      <span>{t("comments.page.noComments")}</span>
    </div>
  );
}
