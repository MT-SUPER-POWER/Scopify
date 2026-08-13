"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCacheSize } from "@/lib/cache/presentation";
import { useI18n } from "@/store/module/i18n";
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
  const { t } = useI18n();

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
