"use client";

import { WifiOff } from "lucide-react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { QuietState } from "@/components/shared/QuietState";
import { useTranslation } from "react-i18next";

import type { QueryPendingProps } from "@/types/query/boundaryComponents";

export function QueryPending({ isPaused }: QueryPendingProps) {
  const { t } = useTranslation();
  return isPaused ? (
    <QuietState compact icon={WifiOff} title={t("network.offline.subtitle")} />
  ) : (
    <Skeleton className="h-40 w-full bg-skeleton" />
  );
}
