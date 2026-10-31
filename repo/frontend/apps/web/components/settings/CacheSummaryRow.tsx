"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@scopify/ui/shadcn/components/button";
import { formatCacheSize } from "@/lib/cache/presentation";
import { useTranslation } from "react-i18next";

import { SettingRow } from "./SettingsUI";

export function CacheSummaryRow({
  label,
  maxSizeMB,
  sizeBytes,
}: {
  label?: string;
  maxSizeMB: number;
  sizeBytes: number | undefined;
}) {
  const { t } = useTranslation();

  return (
    <SettingRow
      label={label ?? t("settings.cache.usage")}
      sublabel={t("settings.cache.summary.usage", {
        used: formatCacheSize(sizeBytes ?? 0),
        limit: `${maxSizeMB} MB`,
      })}
      control={
        <Button variant="outline" size="sm" asChild>
          <Link href="/setting/cache">
            {t("settings.cache.manage")}
            <ChevronRight />
          </Link>
        </Button>
      }
    />
  );
}
