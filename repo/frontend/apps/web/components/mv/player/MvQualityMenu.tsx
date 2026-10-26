"use client";

import { Check, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvQualityMenuProps } from "@/types/components/mv";

/**
 * 设置菜单（目前只有画质）。不用 Radix 弹层：它渲染到 body，
 * 播放器进入真全屏后就看不到了，所以直接渲染在播放器内部。
 */
export function MvQualityMenu({ resolutions, current, onChange }: MvQualityMenuProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={t("mv.quality")}
        aria-expanded={isOpen}
        className="relative flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
      >
        <Settings
          className={cn("size-5 transition-transform duration-300", isOpen && "rotate-45")}
        />
        {current >= 720 && (
          <span className="absolute top-1.5 right-0.5 rounded-sm bg-brand px-0.5 text-[8px] leading-3 font-bold text-brand-foreground">
            HD
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 bottom-12 min-w-40 overflow-hidden rounded-xl bg-black/85 py-2 text-sm text-white shadow-2xl backdrop-blur-md">
          <p className="px-4 pb-1 text-xs text-white/60">{t("mv.quality")}</p>
          {resolutions.map((br) => (
            <button
              key={br}
              type="button"
              onClick={() => {
                onChange(br);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/10"
            >
              <Check className={cn("size-4", br === current ? "opacity-100" : "opacity-0")} />
              {br}p{br >= 720 && <sup className="text-[9px] text-brand">HD</sup>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
