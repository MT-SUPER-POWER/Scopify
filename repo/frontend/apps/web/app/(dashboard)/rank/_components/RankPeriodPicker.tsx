"use client";

import type { MusicListeningRankRange } from "@scopify/music-domain/library";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { enUS, zhCN, zhTW } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useI18nStore } from "@/store/module/i18n";
import { useTranslation } from "react-i18next";

const RANGES: readonly MusicListeningRankRange[] = ["day", "week", "month", "year"];

export function formatRankDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface RankPeriodPickerProps {
  range: MusicListeningRankRange;
  /** The day the period was picked from; null means the current period. */
  date: Date | null;
  onChange: (range: MusicListeningRankRange, date: Date | null) => void;
}

/** A popover on the right of the page: the period kind, and a calendar to pick which one. */
export function RankPeriodPicker({ range, date, onChange }: RankPeriodPickerProps) {
  const { t } = useTranslation();
  const locale = useI18nStore((state) => state.locale);
  const [open, setOpen] = useState(false);
  const today = new Date();
  const calendarLocale = locale === "zh-CN" ? zhCN : locale === "zh-TW" ? zhTW : enUS;
  const label = date
    ? `${t(`library.rank.range.${range}`)} · ${formatRankDateKey(date)}`
    : t(`library.rank.current.${range}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("library.rank.pickPeriod")}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-brand"
        >
          <CalendarDays className="size-5" />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-auto border-border bg-surface-overlay p-0 text-content"
      >
        <div role="tablist" className="flex items-center gap-1 p-3 pb-0">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={item === range}
              onClick={() => onChange(item, item === "year" ? null : date)}
              className={cn(
                "flex-1 cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors",
                item === range
                  ? "bg-brand text-brand-foreground"
                  : "bg-content/10 text-content-muted hover:text-content",
              )}
            >
              {t(`library.rank.range.${item}`)}
            </button>
          ))}
        </div>
        {range === "year" ? (
          <p className="px-4 py-6 text-center text-sm text-content-muted">
            {t("library.rank.yearHint")}
          </p>
        ) : (
          <Calendar
            mode="single"
            selected={date ?? today}
            defaultMonth={date ?? today}
            onSelect={(picked) => {
              if (!picked) return;
              onChange(range, picked);
              setOpen(false);
            }}
            locale={calendarLocale}
            disabled={{ after: today }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
