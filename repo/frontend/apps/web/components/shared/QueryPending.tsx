"use client";

import { WifiOff } from "lucide-react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { QuietState } from "@/components/shared/QuietState";
import { useI18n } from "@/store/module/i18n";
import type { QueryPendingProps } from "@/types/query/boundaryComponents";

export function QueryPending({ isPaused }: QueryPendingProps) {
  const { t } = useI18n();
  return isPaused ? (
    <QuietState compact icon={WifiOff} title={t("network.offline.subtitle")} />
  ) : (
    <Skeleton className="h-40 w-full bg-skeleton" />
  );
}
