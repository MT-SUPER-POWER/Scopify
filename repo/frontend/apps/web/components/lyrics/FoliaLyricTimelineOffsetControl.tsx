"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/store/module/i18n";

interface FoliaLyricTimelineOffsetControlProps {
  isDaylight: boolean;
  offsetMs: number;
  onOffsetChange: (offsetMs: number) => void;
}

const STEP_MS = 250;

export function FoliaLyricTimelineOffsetControl({
  isDaylight,
  offsetMs,
  onOffsetChange,
}: FoliaLyricTimelineOffsetControlProps) {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState(String(offsetMs));
  const buttonHover = isDaylight
    ? "hover:bg-black/10 active:bg-black/15"
    : "hover:bg-white/10 active:bg-white/15";

  useEffect(() => setInputValue(String(offsetMs)), [offsetMs]);

  const updateOffset = (nextOffset: number) => onOffsetChange(nextOffset);

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-wider uppercase opacity-55">
        {t("lyrics.tab.offset")}
      </span>
      <div className="flex items-center">
        <button
          className={`rounded-md p-1 opacity-70 transition-colors hover:opacity-100 ${buttonHover}`}
          onClick={() => updateOffset(offsetMs - STEP_MS)}
          title="-250ms"
          type="button"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="mx-0.5 flex w-16 items-center justify-center bg-transparent">
          <input
            aria-label={t("lyrics.tab.offset")}
            className="w-10 min-w-0 [appearance:textfield] bg-transparent py-0.5 text-right font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setInputValue(value);
              if (value === "" || value === "-") return;
              const parsed = Number.parseInt(value, 10);
              if (Number.isFinite(parsed)) updateOffset(parsed);
            }}
            step={STEP_MS}
            type="number"
            value={inputValue}
          />
          <span className="ml-0.5 font-mono text-[10px] opacity-50">ms</span>
        </div>
        <button
          className={`rounded-md p-1 opacity-70 transition-colors hover:opacity-100 ${buttonHover}`}
          onClick={() => updateOffset(offsetMs + STEP_MS)}
          title="+250ms"
          type="button"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className={`ml-2 rounded-md p-1 transition-colors ${isDaylight ? "hover:bg-black/10" : "hover:bg-white/10"} ${offsetMs === 0 ? "opacity-30" : "opacity-80"}`}
          disabled={offsetMs === 0}
          onClick={() => updateOffset(0)}
          title={t("lyrics.tab.resetOffset")}
          type="button"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
