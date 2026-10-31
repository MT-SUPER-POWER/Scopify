"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { useI18n } from "@/store/module/i18n";

export function RecentReportLink() {
  const { t } = useI18n();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/recent/report"
          aria-label={t("library.listeningReport.entry")}
          className="relative inline-flex cursor-pointer items-center justify-center text-content-muted transition-colors hover:text-content"
        >
          <BarChart3 className="size-7 md:size-8" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {t("library.listeningReport.entry")}
      </TooltipContent>
    </Tooltip>
  );
}
