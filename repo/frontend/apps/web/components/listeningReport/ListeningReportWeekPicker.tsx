"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useMemo } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAvailableWeeks, type WeekOption } from "@/lib/listeningReport/dateHelpers";
import { cn } from "@/lib/utils";

export interface ListeningReportWeekPickerProps {
  onSelectWeek: (week: WeekOption) => void;
  selectedWeekKey: string;
}

export function ListeningReportWeekPicker({
  onSelectWeek,
  selectedWeekKey,
}: ListeningReportWeekPickerProps) {
  const weeks = useMemo(() => getAvailableWeeks(16), []);
  const currentIndex = weeks.findIndex((week) => week.key === selectedWeekKey);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentWeek = weeks[safeIndex];
  const canGoPrevious = safeIndex < weeks.length - 1;
  const canGoNext = safeIndex > 0;

  return (
    <div className="flex h-9 items-center rounded-full border border-border/80 bg-surface-sunken/80 p-1">
      <button
        type="button"
        aria-label="上一周"
        onClick={() => {
          const previousWeek = weeks[safeIndex + 1];
          if (canGoPrevious && previousWeek) onSelectWeek(previousWeek);
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
            <span>{currentWeek?.label ?? "本周"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 rounded-2xl border border-border/80 bg-surface-overlay/95 p-2 shadow-floating backdrop-blur-xl"
        >
          <p className="px-2 py-1.5 text-[11px] font-semibold text-content-muted">
            选择收听周报周期
          </p>
          <div className="mt-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto pr-1">
            {weeks.map((week) => {
              const isSelected = week.key === selectedWeekKey;
              return (
                <button
                  key={week.key}
                  type="button"
                  onClick={() => onSelectWeek(week)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-brand font-bold text-brand-foreground"
                      : "text-content-muted hover:bg-surface-raised hover:text-content",
                  )}
                >
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-xs",
                        isSelected ? "font-bold text-brand-foreground" : "text-content",
                      )}
                    >
                      {week.label}
                    </span>
                    {week.subLabel ? (
                      <span
                        className={cn(
                          "text-[10px]",
                          isSelected ? "text-brand-foreground/80" : "text-content-muted",
                        )}
                      >
                        {week.subLabel}
                      </span>
                    ) : null}
                  </div>
                  {week.isCurrent ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isSelected
                          ? "bg-brand-foreground/15 text-brand-foreground"
                          : "bg-brand/10 text-brand",
                      )}
                    >
                      本周
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
        aria-label="下一周"
        onClick={() => {
          const nextWeek = weeks[safeIndex - 1];
          if (canGoNext && nextWeek) onSelectWeek(nextWeek);
        }}
        disabled={!canGoNext}
        className="flex size-7 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-raised hover:text-content disabled:cursor-not-allowed disabled:opacity-30"
      >
        <IconChevronRight className="size-4" stroke={1.8} />
      </button>
    </div>
  );
}
