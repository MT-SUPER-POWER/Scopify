"use client";

import { FoliaQuickEffectPicker } from "@/components/lyrics/FoliaQuickEffectPicker";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";
import type { Theme } from "@/components/lyrics/folia/src/types";

export function FoliaAudioQualityControl({ theme }: { theme: Theme }) {
  const { t } = useI18n();
  const { changeMusicQuality, isChanging, musicQuality } = useMusicQuality();
  const isDaylight = theme.name === "snow";
  const qualityOptions = QUALITY_OPTIONS.map((option) => ({
    label: String(t(option.labelKey)).replace(/\s*\(.*?\)/g, ""),
    value: option.value,
  }));

  return (
    <section className={`border-t pt-4 ${isDaylight ? "border-black/5" : "border-white/5"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {t("playbar.qualityTitle")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={String(t("playbar.qualityTitle"))}
            isDaylight={isDaylight}
            onChange={(quality) => {
              if (!isChanging) void changeMusicQuality(quality);
            }}
            options={qualityOptions}
            primaryColor={theme.primaryColor}
            value={musicQuality}
          />
        </span>
      </div>
    </section>
  );
}
