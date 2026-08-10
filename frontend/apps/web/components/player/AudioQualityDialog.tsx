"use client";

import { Check, HelpCircle } from "lucide-react";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";
import type { QualityOptionKey } from "@/types/playerBar";
import { cn } from "@/lib/utils";

function SvipBadge() {
  return (
    <span className="border-warning/50 bg-warning/10 text-warning inline-flex shrink-0 items-center rounded-[2px] border px-1 py-px text-[9px] leading-none font-medium">
      SVIP
    </span>
  );
}

function VipBadge() {
  return (
    <span className="border-danger/50 bg-danger/10 text-danger inline-flex shrink-0 items-center rounded-[2px] border px-1 py-px text-[9px] leading-none font-medium">
      VIP
    </span>
  );
}

export function AudioQualityDialog() {
  const { t } = useI18n();
  const { changeMusicQuality, musicQuality } = useMusicQuality();

  const heroOptions = QUALITY_OPTIONS.filter((opt) => opt.isHero);
  const listOptions = QUALITY_OPTIONS.filter((opt) => !opt.isHero);

  const handleSelect = (val: QualityOptionKey) => {
    void changeMusicQuality(val);
  };

  return (
    <div className="border-brand/20 bg-brand/5 text-content min-w-0 overflow-hidden rounded-2xl border p-3 select-none sm:p-4">
      {/* 顶栏标题 */}
      <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-3.5">
        <h3 className="text-content text-sm font-bold tracking-tight">
          {t("playbar.quality.headerTitle") || "当前歌曲音质"}
        </h3>
        <button
          type="button"
          className="text-content-subtle hover:text-content flex shrink-0 cursor-pointer items-center gap-1 text-xs transition-colors"
          onClick={() => {
            // 可展开详情提示
          }}
        >
          <span>{t("playbar.quality.learnMore") || "了解音质"}</span>
          <HelpCircle size={12} />
        </button>
      </div>

      {/* 顶部旗舰双卡片 (Scopify Green Accent Hero Tiers) */}
      <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {heroOptions.map((opt) => {
          const isSelected = musicQuality === opt.value;
          const Icon = opt.icon;

          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative flex w-full cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition-all",
                isSelected
                  ? "border-brand/50 bg-brand/10 shadow-panel"
                  : "border-brand/15 bg-brand/5 hover:border-brand/30 hover:bg-brand/10",
              )}
            >
              {/* Top Row: Icon & Badge */}
              <div className="mb-3 flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-transform group-hover:scale-105",
                    isSelected
                      ? "bg-brand/15 text-brand"
                      : "bg-brand/10 text-brand/70 group-hover:bg-brand/15 group-hover:text-brand",
                  )}
                >
                  {Icon && <Icon className="size-5" />}
                </div>
                {opt.badgeType === "svip" && <SvipBadge />}
              </div>

              {/* Text Info */}
              <div>
                <div
                  className={cn(
                    "text-sm font-bold tracking-tight transition-colors",
                    isSelected ? "text-brand" : "text-content",
                  )}
                >
                  {t(opt.labelKey)}
                </div>
                {opt.sublabelKey && (
                  <div className="text-content-subtle text-[11px] font-medium tracking-wider">
                    {t(opt.sublabelKey)}
                  </div>
                )}
                {opt.techSpec && (
                  <div className="text-content-muted mt-1.5 text-[11px] leading-tight">
                    {t(opt.techSpec)}
                  </div>
                )}
              </div>

              {/* Active Indicator checkmark (Scopify Green) */}
              {isSelected && (
                <div className="bg-brand text-brand-foreground absolute top-2.5 right-2.5 flex size-4.5 items-center justify-center rounded-full shadow-xs">
                  <Check size={11} strokeWidth={3.5} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 列表音质 (Scopify Style Stacked List) */}
      <div className="space-y-1">
        {listOptions.map((opt) => {
          const isSelected = musicQuality === opt.value;
          const Icon = opt.icon;

          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all",
                isSelected ? "border-brand/30 bg-brand/10" : "hover:bg-brand/8 border-transparent",
              )}
            >
              {/* Left Side: Icon / Circle Badge + Text */}
              <div className="flex min-w-0 items-center gap-3">
                {/* Circle Icon Container */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                    isSelected
                      ? "bg-brand/15 text-brand"
                      : "bg-brand/8 text-brand/70 group-hover:bg-brand/15 group-hover:text-brand",
                  )}
                >
                  {opt.shortLabel ? (
                    <span className="text-xs font-black tracking-tight">{opt.shortLabel}</span>
                  ) : Icon ? (
                    <Icon className="size-4" />
                  ) : null}
                </div>

                {/* Main Text & Tech Spec */}
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-semibold tracking-tight transition-colors",
                        isSelected ? "text-brand" : "text-content",
                      )}
                    >
                      {t(opt.labelKey)}
                    </span>
                    {opt.badgeType === "svip" && <SvipBadge />}
                    {opt.badgeType === "vip" && <VipBadge />}
                  </div>
                  {opt.techSpec && (
                    <span className="text-content-muted mt-0.5 truncate text-[11px]">
                      {t(opt.techSpec)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Selected Checkmark (Scopify Green) */}
              {isSelected && (
                <div className="bg-brand text-brand-foreground ml-2 flex size-5 shrink-0 items-center justify-center rounded-full shadow-xs">
                  <Check size={12} strokeWidth={3.5} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
