"use client";

import { Check, HelpCircle } from "lucide-react";
import React from "react";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";
import type { QualityOptionKey } from "@/types/playerBar";
import { cn } from "@/lib/utils";

function SvipBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-[2px] border border-[#a67d16] bg-[#c4931c]/10 px-1 py-[1px] text-[9px] leading-none font-medium text-[#dfb42b]">
      SVIP
    </span>
  );
}

function VipBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-[2px] border border-[#9c4141] bg-[#c24c4c]/8 px-1 py-[1px] text-[9px] leading-none font-medium text-[#d86666]">
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
    <div className="w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#121216]/95 p-4 text-white shadow-2xl backdrop-blur-2xl select-none md:w-[380px]">
      {/* 顶栏标题 */}
      <div className="mb-3.5 flex items-center justify-between px-1">
        <h3 className="text-sm font-bold tracking-tight text-white/90">
          {t("playbar.quality.headerTitle") || "当前歌曲音质"}
        </h3>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/80"
          onClick={() => {
            // 可展开详情提示
          }}
        >
          <span>{t("playbar.quality.learnMore") || "了解音质"}</span>
          <HelpCircle size={12} />
        </button>
      </div>

      {/* 顶部旗舰双卡片 (Scopify Green Accent Hero Tiers) */}
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        {heroOptions.map((opt) => {
          const isSelected = musicQuality === opt.value;
          const Icon = opt.icon;

          return (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative flex cursor-pointer flex-col justify-between rounded-xl p-3.5 transition-all",
                "border bg-gradient-to-b from-white/[0.05] to-white/[0.01]",
                isSelected
                  ? "border-[#1ed760]/60 bg-gradient-to-b from-[#1ed760]/15 via-white/[0.04] to-transparent shadow-[0_0_20px_rgba(30,215,96,0.15)]"
                  : "border-white/10 hover:border-white/20 hover:bg-white/[0.06]",
              )}
            >
              {/* Top Row: Icon & Badge */}
              <div className="mb-3 flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-transform group-hover:scale-105",
                    isSelected
                      ? "bg-[#1ed760]/20 text-[#1ed760]"
                      : "bg-white/10 text-white/70 group-hover:text-white",
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
                    isSelected ? "text-[#1ed760]" : "text-white",
                  )}
                >
                  {t(opt.labelKey)}
                </div>
                {opt.sublabelKey && (
                  <div className="text-[11px] font-medium tracking-wider text-white/40">
                    {t(opt.sublabelKey)}
                  </div>
                )}
                {opt.techSpec && (
                  <div className="mt-1.5 text-[11px] leading-tight text-white/50">
                    {t(opt.techSpec)}
                  </div>
                )}
              </div>

              {/* Active Indicator checkmark (Scopify Green) */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex size-4.5 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-xs">
                  <Check size={11} strokeWidth={3.5} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 列表音质 (Scopify Style Stacked List) */}
      <div className="space-y-1">
        {listOptions.map((opt) => {
          const isSelected = musicQuality === opt.value;
          const Icon = opt.icon;

          return (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all",
                isSelected
                  ? "border border-[#1ed760]/30 bg-[#1ed760]/10"
                  : "border border-transparent hover:bg-white/5",
              )}
            >
              {/* Left Side: Icon / Circle Badge + Text */}
              <div className="flex min-w-0 items-center gap-3">
                {/* Circle Icon Container */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                    isSelected
                      ? "bg-[#1ed760]/20 text-[#1ed760]"
                      : "bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white/90",
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
                        isSelected ? "text-[#1ed760]" : "text-white/90 group-hover:text-white",
                      )}
                    >
                      {t(opt.labelKey)}
                    </span>
                    {opt.badgeType === "svip" && <SvipBadge />}
                    {opt.badgeType === "vip" && <VipBadge />}
                  </div>
                  {opt.techSpec && (
                    <span className="mt-0.5 truncate text-[11px] text-white/45">
                      {t(opt.techSpec)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Selected Checkmark (Scopify Green) */}
              {isSelected && (
                <div className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-xs">
                  <Check size={12} strokeWidth={3.5} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
