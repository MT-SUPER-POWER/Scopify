"use client";

import { IconRefresh } from "@tabler/icons-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ListeningReportPeriod } from "@/types/api/listeningReport";
import type { ListeningReportHeaderProps } from "@/types/listeningReport";

import { ListeningReportMonthPicker } from "./ListeningReportMonthPicker";
import { ListeningReportWeekPicker } from "./ListeningReportWeekPicker";

const PERIODS: ListeningReportPeriod[] = ["week", "month", "year"];

export function ListeningReportHeader({
  isRefetching,
  onPeriodChange,
  onRefresh,
  onSelectMonth,
  onSelectWeek,
  period,
  selectedMonthKey,
  selectedWeekKey,
}: ListeningReportHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {period === "week" ? (
        <ListeningReportWeekPicker selectedWeekKey={selectedWeekKey} onSelectWeek={onSelectWeek} />
      ) : period === "month" ? (
        <ListeningReportMonthPicker
          selectedMonthKey={selectedMonthKey}
          onSelectMonth={onSelectMonth}
        />
      ) : null}

      <Tabs
        value={period}
        onValueChange={(value) => onPeriodChange(value as ListeningReportPeriod)}
      >
        <TabsList className="h-9 rounded-full border border-border/80 bg-surface-elevated/70 p-1 shadow-none backdrop-blur-md">
          {PERIODS.map((item) => (
            <TabsTrigger
              key={item}
              value={item}
              className="h-7 rounded-full px-2.5 text-xs font-bold text-content-muted transition-all data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-sm"
            >
              {t(`library.listeningReport.period.${item}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <button
        type="button"
        aria-label={`${t("library.listeningReport.source")} · ${t("library.listeningReport.refresh")}`}
        onClick={onRefresh}
        disabled={isRefetching}
        className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-surface-elevated/70 text-content-muted backdrop-blur-md transition-all hover:bg-surface-elevated hover:text-content focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none active:scale-95 disabled:cursor-wait disabled:opacity-50"
        title={`${t("library.listeningReport.source")} · ${t("library.listeningReport.refresh")}`}
      >
        <IconRefresh
          className={cn("size-4", isRefetching && "animate-spin text-brand")}
          stroke={2}
        />
      </button>
    </div>
  );
}
