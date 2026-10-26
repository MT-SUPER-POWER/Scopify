"use client";

import { useSearchParams } from "next/navigation";
import { MvPageContent } from "@/components/mv/MvPageContent";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useI18n } from "@/store/module/i18n";

export function MvPage() {
  const { t } = useI18n();
  const mvid = Number(useSearchParams().get("id")) || 0;
  if (!Number.isSafeInteger(mvid) || mvid <= 0)
    return (
      <p className="flex min-h-[60vh] items-center justify-center text-content-muted">
        {t("mv.status.invalid")}
      </p>
    );
  return (
    <QueryBoundary resetKey={`mv:detail:${mvid}`}>
      <MvPageContent mvid={mvid} />
    </QueryBoundary>
  );
}
