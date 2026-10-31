"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Settings,
  SlidersHorizontal,
  Gauge,
  SkipForward,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvSettingsMenuProps } from "@/types/mv/components";

const ROW =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none";
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function MvSettingsMenu({
  resolutions,
  current,
  quality,
  playbackRate,
  autoNext,
  onQualityChange,
  onPlaybackRateChange,
  onAutoNextChange,
  open,
  onOpenChange,
}: MvSettingsMenuProps) {
  const { t } = useI18n();
  const [page, setPage] = useState<"main" | "quality" | "speed">("main");
  const changeOpen = (next: boolean) => {
    onOpenChange(next);
    if (!next) setPage("main");
  };
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={t("mv.player.settings")}
          title={t("mv.player.settings")}
          className="flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
        >
          <Settings className="size-5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        side="top"
        align="end"
        sideOffset={8}
        className="z-20 w-64 rounded-xl bg-black/95 p-1.5 text-white shadow-xl ring-1 ring-white/10 outline-none"
      >
        {page === "main" ? (
          <>
            <button type="button" className={ROW} onClick={() => setPage("quality")}>
              <SlidersHorizontal className="size-4" />
              <span className="flex-1">{t("mv.quality")}</span>
              <span className="text-white/70">
                {quality === null ? `${t("mv.player.auto")} (${current}p)` : `${current}p`}
              </span>
              <ChevronRight className="size-4" />
            </button>
            <button type="button" className={ROW} onClick={() => setPage("speed")}>
              <Gauge className="size-4" />
              <span className="flex-1">{t("mv.player.speed")}</span>
              <span className="text-white/70">
                {playbackRate === 1 ? t("mv.player.normal") : `${playbackRate}×`}
              </span>
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={autoNext}
              className={ROW}
              onClick={() => onAutoNextChange(!autoNext)}
            >
              <SkipForward className="size-4" />
              <span className="flex-1">{t("mv.player.autoNext")}</span>
              <span
                aria-hidden
                className={cn("h-5 w-9 rounded-full p-0.5", autoNext ? "bg-white" : "bg-white/30")}
              >
                <span
                  className={cn(
                    "block size-4 rounded-full",
                    autoNext ? "translate-x-4 bg-black" : "bg-white",
                  )}
                />
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={cn(ROW, "rounded-none border-b border-white/15 font-medium")}
              onClick={() => setPage("main")}
            >
              <ChevronLeft className="size-4" />
              {t(page === "quality" ? "mv.quality" : "mv.player.speed")}
            </button>
            <div className="max-h-[min(50vh,22rem)] overflow-y-auto py-1">
              {page === "quality" ? (
                <>
                  {resolutions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={ROW}
                      onClick={() => {
                        onQualityChange(value);
                        setPage("main");
                      }}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          (quality === null || current !== value) && "invisible",
                        )}
                      />
                      {value}p
                    </button>
                  ))}
                  <button
                    type="button"
                    className={ROW}
                    onClick={() => {
                      onQualityChange(null);
                      setPage("main");
                    }}
                  >
                    <Check className={cn("size-4", quality !== null && "invisible")} />
                    {t("mv.player.auto")} ({current}p)
                  </button>
                </>
              ) : (
                RATES.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={ROW}
                    onClick={() => {
                      onPlaybackRateChange(rate);
                      setPage("main");
                    }}
                  >
                    <Check className={cn("size-4", rate !== playbackRate && "invisible")} />
                    {rate === 1 ? t("mv.player.normal") : `${rate}×`}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
