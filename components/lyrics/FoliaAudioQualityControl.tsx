"use client";

import { Check } from "lucide-react";

import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";
import type { Theme } from "@/components/lyrics/folia/src/types";

export function FoliaAudioQualityControl({ theme }: { theme: Theme }) {
  const { t } = useI18n();
  const { changeMusicQuality, isChanging, musicQuality } = useMusicQuality();
  const isDaylight = theme.name === "snow";

  return (
    <section
      className={`space-y-3 border-b pb-4 ${isDaylight ? "border-black/10" : "border-white/10"}`}
    >
      <div>
        <h3 className="text-sm font-medium" style={{ color: theme.primaryColor }}>
          {t("playbar.qualityTitle")}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUALITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = option.value === musicQuality;
          return (
            <button
              className={`relative flex min-h-16 items-center gap-2 rounded-md border p-2 text-left transition-colors disabled:opacity-50 ${
                isDaylight ? "hover:bg-black/5" : "hover:bg-white/5"
              }`}
              disabled={isChanging}
              key={option.value}
              onClick={() => void changeMusicQuality(option.value)}
              style={{
                backgroundColor: isSelected
                  ? `${theme.accentColor}${isDaylight ? "1f" : "29"}`
                  : undefined,
                borderColor: isSelected
                  ? theme.accentColor
                  : isDaylight
                    ? "rgba(0,0,0,0.12)"
                    : "rgba(255,255,255,0.12)",
              }}
              type="button"
            >
              <Icon className="size-4 shrink-0" style={{ color: theme.accentColor }} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{t(option.labelKey)}</span>
                <span className="block truncate text-[11px] opacity-55">
                  {t(option.sublabelKey)}
                </span>
              </span>
              {isSelected ? (
                <Check
                  className="absolute top-2 right-2 size-3.5"
                  style={{ color: theme.accentColor }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
