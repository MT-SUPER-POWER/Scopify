"use client";

import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { PersonalFmRefreshButtonProps } from "@/types/personalFm/model";

export function PersonalFmRefreshButton({ isRefreshing, onRefresh }: PersonalFmRefreshButtonProps) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t("personalFm.action.refreshDescription")}
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={cn("size-5", isRefreshing && "animate-spin")} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {t("personalFm.action.refreshDescription")}
      </TooltipContent>
    </Tooltip>
  );
}
