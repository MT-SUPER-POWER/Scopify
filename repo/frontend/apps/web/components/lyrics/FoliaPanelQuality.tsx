"use client";

import { Check } from "lucide-react";
import { FoliaPanelRow, FoliaSegments } from "@scopify/ui/scopify/components/folia-panel/controls";

import { IMMERSE_TYPES } from "@/constants/musicQuality";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";

// The quality tab, in the place of Folia's account tab (panelTab/AccountTab.tsx keeps the default
// audio quality there): every quality as one row, the one in use ticked, and the immersive variant
// as a choice under 沉浸声 while it is in use.

export function FoliaPanelQuality() {
  const { t } = useI18n();
  const { changeMusicQuality, changeImmerseType, immerseType, musicQuality, isChanging } =
    useMusicQuality();

  return (
    <div>
      <div role="radiogroup" aria-label={t("playbar.quality.preference")} className="space-y-0.5">
        {QUALITY_OPTIONS.map((option) => {
          const selected = musicQuality === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isChanging}
              onClick={() => void changeMusicQuality(option.value)}
              className={`st-t-fast st-focus-inside flex min-h-12 w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${selected ? "bg-[var(--st-fill)]" : "hover:bg-[var(--st-fill)]"}`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--st-fill)] ${selected ? "text-[color:var(--st-accent)]" : "text-[color:var(--st-t3)]"}`}
              >
                {option.shortLabel ? (
                  <span className="text-[11px] font-bold">{option.shortLabel}</span>
                ) : Icon ? (
                  <Icon className="size-4" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm leading-5">
                  <span className="truncate">{t(option.labelKey)}</span>
                  {option.badgeType ? (
                    <span className="shrink-0 rounded bg-[var(--st-fill2)] px-[5px] py-px text-[10px] leading-[14px] font-semibold text-[color:var(--st-t2)]">
                      {option.badgeType.toUpperCase()}
                    </span>
                  ) : null}
                </span>
                {option.sublabelKey ? (
                  <span className="block truncate text-xs leading-4 text-[color:var(--st-t3)]">
                    {t(option.sublabelKey)}
                  </span>
                ) : null}
              </span>
              <Check
                size={16}
                strokeWidth={2.5}
                className={`st-t-move shrink-0 text-[color:var(--st-accent)] transition-[opacity,scale] ${selected ? "" : "scale-50 opacity-0"}`}
              />
            </button>
          );
        })}
      </div>

      {musicQuality === "sky" ? (
        <FoliaPanelRow label={t("playbar.quality.immerse")}>
          <FoliaSegments
            size="s"
            value={immerseType}
            onChange={(variant) => void changeImmerseType(variant)}
            options={IMMERSE_TYPES.map((variant) => ({
              disabled: isChanging,
              label: t(`playbar.quality.immerse.${variant}`),
              value: variant,
            }))}
          />
        </FoliaPanelRow>
      ) : null}

      <p className="px-1 pt-2 pb-1 text-xs leading-4 text-[color:var(--st-t3)]">
        {t("playbar.quality.availability")}
      </p>
    </div>
  );
}
