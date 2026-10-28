"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvQualityMenuProps } from "@/types/mv/components";

/** 原生选择器在播放器真全屏内仍可用，并保留键盘选择行为。 */
export function MvQualityMenu({ resolutions, current, onChange }: MvQualityMenuProps) {
  const { t } = useI18n();

  return (
    <div className="relative flex h-8 items-center text-white">
      <select
        value={current}
        aria-label={t("mv.quality")}
        title={t("mv.quality")}
        disabled={resolutions.length < 2}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-md bg-transparent text-sm font-medium tabular-nums scheme-dark transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default",
          resolutions.length > 1 ? "pr-6 pl-2" : "px-2",
        )}
      >
        {resolutions.map((br) => (
          <option key={br} value={br} className="bg-black text-white">
            {br}p
          </option>
        ))}
      </select>
      {resolutions.length > 1 ? (
        <ChevronDown className="pointer-events-none absolute right-1.5 size-3" />
      ) : null}
    </div>
  );
}
