"use client";

import { Check, HelpCircle } from "lucide-react";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";
import type { QualityOptionKey } from "@/types/playerBar";
import { cn } from "@/lib/utils";

import { MediaInfoBadge } from "@/components/shared/MediaInfoBadge";

function SvipBadge() {
  return (
    <MediaInfoBadge tone="gold" title="SVIP" ariaLabel="SVIP">
      SVIP
    </MediaInfoBadge>
  );
}

function VipBadge() {
  return (
    <MediaInfoBadge tone="red" title="VIP" ariaLabel="VIP">
      VIP
    </MediaInfoBadge>
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
    <div className="text-content select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h3 className="text-sm font-semibold text-content">
          {t("playbar.quality.headerTitle") || "当前歌曲音质"}
        </h3>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-content-subtle transition-colors hover:text-content-muted"
          onClick={() => {}}
        >
          <span>{t("playbar.quality.learnMore") || "了解音质"}</span>
          <HelpCircle size={12} />
        </button>
      </div>

      {/* Hero Cards */}
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
                  ? "border-primary/50 bg-primary/10 shadow-sm"
                  : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50",
              )}
            >
              {/* Top Row: Icon & Badge */}
              <div className="mb-3 flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-transform group-hover:scale-105",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-warning/10 text-warning group-hover:bg-warning/20", // Hero default icons use warning/gold color
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
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {t(opt.labelKey)}
                </div>
                {opt.sublabelKey && (
                  <div className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground">
                    {t(opt.sublabelKey)}
                  </div>
                )}
                {opt.techSpec && (
                  <div className="mt-1 text-[11px] leading-tight text-muted-foreground/70">
                    {t(opt.techSpec)}
                  </div>
                )}
              </div>

              {/* Active Indicator checkmark */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 列表音质 */}
      <div className="space-y-0.5">
        {listOptions.map((opt) => {
          const isSelected = musicQuality === opt.value;
          const Icon = opt.icon;

          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative flex w-full cursor-pointer items-center justify-between rounded-xl border border-transparent p-2 text-left transition-all",
                isSelected ? "border-primary/20 bg-primary/10" : "hover:bg-accent",
              )}
            >
              {/* Left Side: Icon / Circle Badge + Text */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                  )}
                >
                  {opt.shortLabel ? (
                    <span className="text-[10px] font-black">{opt.shortLabel}</span>
                  ) : Icon ? (
                    <Icon className="size-4" />
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {t(opt.labelKey)}
                    </span>
                    {opt.badgeType === "svip" && <SvipBadge />}
                    {opt.badgeType === "vip" && <VipBadge />}
                  </div>
                  {opt.techSpec && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {t(opt.techSpec)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Selected Checkmark */}
              {isSelected && (
                <div className="ml-2 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
