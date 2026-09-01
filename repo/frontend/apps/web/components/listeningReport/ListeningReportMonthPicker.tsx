"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useMemo } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MonthOption } from "@/lib/listeningReport/dateHelpers";
import { getAvailableMonths } from "@/lib/listeningReport/dateHelpers";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export interface ListeningReportMonthPickerProps {
  onSelectMonth: (month: MonthOption) => void;
  selectedMonthKey: string;
}

export function ListeningReportMonthPicker({
  onSelectMonth,
  selectedMonthKey,
}: ListeningReportMonthPickerProps) {
  const { t } = useI18n();
  const months = useMemo(() => getAvailableMonths(12), []);
  const currentIndex = months.findIndex((month) => month.key === selectedMonthKey);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentMonth = months[safeIndex];
  const canGoPrevious = safeIndex < months.length - 1;
  const canGoNext = safeIndex > 0;

  return (
    <div className="flex h-9 items-center rounded-full border border-border/80 bg-surface-sunken/80 p-1">
      <button
        type="button"
        aria-label={t("library.listeningReport.previousMonth")}
        onClick={() => {
          const previousMonth = months[safeIndex + 1];
          if (canGoPrevious && previousMonth) onSelectMonth(previousMonth);
        }}
        disabled={!canGoPrevious}
        className="flex size-7 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-raised hover:text-content disabled:cursor-not-allowed disabled:opacity-30"
      >
        <IconChevronLeft className="size-4" stroke={1.8} />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-bold text-content transition-colors hover:bg-surface-raised"
          >
            <span>{currentMonth?.label ?? t("library.listeningReport.currentMonth")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-60 rounded-2xl border border-border/80 bg-surface-overlay/95 p-2 shadow-floating backdrop-blur-xl"
        >
          <p className="px-2 py-1.5 text-[11px] font-semibold text-content-muted">
            {t("library.listeningReport.monthSelect")}
          </p>
          <div className="mt-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto pr-1">
            {months.map((month) => {
              const isSelected = month.key === selectedMonthKey;
              return (
                <button
                  key={month.key}
                  type="button"
                  onClick={() => onSelectMonth(month)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-brand font-bold text-brand-foreground"
                      : "text-content-muted hover:bg-surface-raised hover:text-content",
                  )}
                >
                  <span>{month.label}</span>
                  {month.isCurrent ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isSelected
                          ? "bg-brand-foreground/15 text-brand-foreground"
                          : "bg-brand/10 text-brand",
                      )}
                    >
                      {t("library.listeningReport.currentMonth")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        aria-label={t("library.listeningReport.nextMonth")}
        onClick={() => {
          const nextMonth = months[safeIndex - 1];
          if (canGoNext && nextMonth) onSelectMonth(nextMonth);
        }}
        disabled={!canGoNext}
        className="flex size-7 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-raised hover:text-content disabled:cursor-not-allowed disabled:opacity-30"
      >
        <IconChevronRight className="size-4" stroke={1.8} />
      </button>
    </div>
  );
}
